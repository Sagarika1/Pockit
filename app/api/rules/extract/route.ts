import Anthropic from "@anthropic-ai/sdk";
import { requireTreasurer } from "@/lib/auth";
import { bad } from "@/lib/http";
import { CATEGORY_KEYS, sanitizeRules } from "@/lib/rules";
import { DEMO_RULES_SUGGESTION, isDemoReader } from "@/lib/demoReader";

// Created on first use, so the app still starts without an Anthropic key (demo mode)
let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

const IMAGES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const categoryRuleSchema = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["auto", "review", "deny"] },
    cap: { type: ["number", "null"], description: "Dollar limit for automatic payment, or null for no limit" },
  },
  required: ["action", "cap"],
};

// The AI only SUGGESTS rules from the document. The treasurer reviews and saves them.
export async function POST(req: Request) {
  const auth = await requireTreasurer();
  if (!auth.ok) return auth.response;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return bad("Choose a file to upload.");
  if (file.size > MAX_BYTES) return bad("That file is over 5 MB. Try a smaller one.");

  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isImage = IMAGES.includes(file.type);
  const isText = file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md");
  if (!isPdf && !isImage && !isText) return bad("Upload a PDF, a photo or screenshot (JPG, PNG, WebP), or a .txt file.");

  if (isDemoReader()) {
    const { summary, assumptions, ...suggestion } = DEMO_RULES_SUGGESTION;
    return Response.json({ rules: sanitizeRules(suggestion, auth.org.rules), summary, assumptions });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [];
  if (isPdf) content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: bytes.toString("base64") } });
  else if (isImage) content.push({ type: "image", source: { type: "base64", media_type: file.type, data: bytes.toString("base64") } });
  else content.push({ type: "text", text: `Here is the document:\n\n${bytes.toString("utf8").slice(0, 30_000)}` });

  const today = new Date().toISOString().slice(0, 10);
  content.push({
    type: "text",
    text: `This is a reimbursement or spending policy for a club or nonprofit. Turn it into rules by calling the propose_rules tool exactly once. Do not reply with plain text. Today's date is ${today}.

Their current rules, for anything the document does not mention:
${JSON.stringify(auth.org.rules)}

Guidelines:
- Only change a value if the document clearly says something about it. Otherwise keep the current value.
- action "auto" = pay automatically (use "cap" for a per-receipt dollar limit), "review" = the treasurer must approve each one, "deny" = never reimburse.
- If the document says something needs approval, pre-approval, or an exception, use "review". If it says something is not allowed or not reimbursed, use "deny".
- Dates must be YYYY-MM-DD. If the year is missing, use the next upcoming date.
- "summary": two or three plain sentences saying what you found. No jargon.
- "assumptions": short plain sentences for anything you guessed or left unchanged that the treasurer should double check.`,
  });

  try {
    const response = await getClient().messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 2000,
      tools: [
        {
          name: "propose_rules",
          description: "Record the spending rules found in the document.",
          input_schema: {
            type: "object",
            properties: {
              eventName: { type: "string" },
              eventStart: { type: "string", description: "YYYY-MM-DD" },
              eventEnd: { type: "string", description: "YYYY-MM-DD" },
              requireEventDates: { type: "boolean", description: "True if receipts must be dated within the event" },
              blockAlcohol: { type: "boolean", description: "True if alcohol is not reimbursable" },
              autoPayCeiling: { type: "number", description: "Never pay automatically above this dollar amount" },
              registrationVendorKeywords: { type: "array", items: { type: "string" }, description: "Words a registration vendor name must contain. Empty array if none." },
              categories: {
                type: "object",
                properties: Object.fromEntries(CATEGORY_KEYS.map((k) => [k, categoryRuleSchema])),
                required: [...CATEGORY_KEYS],
              },
              summary: { type: "string" },
              assumptions: { type: "array", items: { type: "string" } },
            },
            required: ["eventName", "eventStart", "eventEnd", "requireEventDates", "blockAlcohol", "autoPayCeiling", "registrationVendorKeywords", "categories", "summary", "assumptions"],
          },
        },
      ],
      messages: [{ role: "user", content }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return bad("We couldn't find rules in that file. Try a clearer copy.", 502);

    const input = toolUse.input as Record<string, unknown>;
    const rules = sanitizeRules(input, auth.org.rules);
    const summary = typeof input.summary === "string" ? input.summary.slice(0, 600) : "";
    const assumptions = Array.isArray(input.assumptions)
      ? input.assumptions.filter((x): x is string => typeof x === "string").slice(0, 8).map((x) => x.slice(0, 240))
      : [];
    return Response.json({ rules, summary, assumptions });
  } catch (err) {
    console.error("Rules extract error:", err);
    return bad("We couldn't read that file right now. Try again.", 500);
  }
}
