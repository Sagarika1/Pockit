import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ReceiptSchema, CATEGORIES } from "@/lib/receipt";
import { requireMember } from "@/lib/auth";
import { signReceipt } from "@/lib/session";
import { DEMO_RECEIPT_MESSAGE, demoReceipt, isDemoReader } from "@/lib/demoReader";

// Created on first use, so the app still starts without an Anthropic key (demo mode)
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

const ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;
type MediaType = (typeof ALLOWED)[number];

export async function POST(req: NextRequest) {
  // Only logged-in members can use the receipt reader (it costs money per call)
  const auth = await requireMember();
  if (!auth.ok) return auth.response;

  const form = await req.formData();
  const file = form.get("receipt") as File | null;

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!ALLOWED.includes(file.type as MediaType))
    return NextResponse.json({ error: "Please use a JPG, PNG, or WebP image" }, { status: 400 });
  if (file.size > 4 * 1024 * 1024)
    return NextResponse.json({ error: "Image is over 4MB. Try a smaller photo." }, { status: 400 });

  if (isDemoReader()) {
    const canned = demoReceipt(file.name);
    if (!canned) return NextResponse.json({ error: DEMO_RECEIPT_MESSAGE }, { status: 400 });
    return NextResponse.json({ ...canned, receiptToken: signReceipt(canned, auth.user.id) });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const today = new Date().toISOString().slice(0, 10);

  try {
    const response = await getClient().messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 1500,
      tools: [
        {
          name: "record_receipt",
          description: "Record the data extracted from a receipt image.",
          input_schema: {
            type: "object",
            properties: {
              vendor: { type: "string", description: "Business name as printed" },
              date: { type: ["string", "null"], description: "Purchase date as YYYY-MM-DD, or null if unreadable" },
              total: { type: "number", description: "Final total paid, including tax and tip" },
              currency: { type: "string", description: "ISO 4217 code, e.g. USD" },
              category: {
                type: "string",
                enum: [...CATEGORIES],
                description:
                  "meals = restaurants, cafes, groceries, food. rideshare = Uber, Lyft, taxi. registration = conference or event fees. hotel = lodging. flight = airfare. other = anything else.",
              },
              contains_alcohol: {
                type: "boolean",
                description: "True if any line item is beer, wine, liquor, or other alcohol",
              },
              line_items: {
                type: "array",
                description: "Each purchased item with its price",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    amount: { type: "number" },
                  },
                  required: ["description", "amount"],
                },
              },
              needs_review: {
                type: "boolean",
                description: "True if the image is blurry, cropped, not a receipt, or any field is a guess",
              },
              review_reason: {
                type: ["string", "null"],
                description: "Short explanation if needs_review is true, otherwise null",
              },
            },
            required: [
              "vendor", "date", "total", "currency", "category",
              "contains_alcohol", "line_items", "needs_review", "review_reason",
            ],
          },
        },
      ],
      tool_choice: { type: "auto" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: file.type as MediaType, data: base64 } },
            {
              type: "text",
              text: `Extract the data from this receipt. Today's date is ${today}.
Rules:
- You must respond by calling the record_receipt tool exactly once. Do not reply with plain text.
- "total" is the final amount paid (after tax and tip), not the subtotal.
- Never invent values. If something is unreadable, use null for the date, make your best guess for other fields, and set needs_review to true.
- Check every line item for alcohol (beer, wine, cocktails, liquor, etc.) and set contains_alcohol accordingly.
- Choose the category using the descriptions in the tool schema. If unsure, use "other".
- If this is not a receipt, set needs_review to true and explain why.`,
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use")
      return NextResponse.json({ error: "Could not read the receipt. Try a clearer photo." }, { status: 502 });

    const parsed = ReceiptSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      console.error("Bad model output:", parsed.error.issues);
      return NextResponse.json({ error: "Receipt data was incomplete. Try again." }, { status: 502 });
    }

    const receipt = parsed.data;

    // Your own deterministic sanity checks (the AI extracts, your code decides)
    if (receipt.date) {
      const ageDays = (Date.now() - new Date(receipt.date).getTime()) / 86_400_000;
      if (ageDays < 0 || ageDays > 90) {
        receipt.needs_review = true;
        receipt.review_reason ??= "Receipt date is in the future or older than 90 days";
      }
    } else {
      receipt.needs_review = true;
      receipt.review_reason ??= "Date was unreadable";
    }
    if (receipt.total <= 0) {
      receipt.needs_review = true;
      receipt.review_reason ??= "Total was zero or negative";
    }

    // The signature lets /api/claims confirm these numbers came from here, unedited
    return NextResponse.json({ ...receipt, receiptToken: signReceipt(receipt, auth.user.id) });
  } catch (err) {
    console.error("Anthropic error:", err);
    return NextResponse.json({ error: "Receipt reader is unavailable right now" }, { status: 500 });
  }
}