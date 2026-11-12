import { randomUUID } from "crypto";
import { connection } from "next/server";
import { getSession, requireMember } from "@/lib/auth";
import { getOrg, read, update, type Membership } from "@/lib/db";
import { bad, readJson, text } from "@/lib/http";
import { textMemberAboutClaim, textTreasurerAboutClaim } from "@/lib/notify";
import { sendPayout } from "@/lib/paypal";
import { ownsImage } from "@/lib/receiptImages";
import { evaluate, type Receipt } from "@/lib/policy";
import { CATEGORY_KEYS } from "@/lib/rules";
import { verifyReceipt } from "@/lib/session";
import { amountToPay, getClaims, updateClaim, type Claim } from "@/lib/store";

// Treasurers see every claim for their organization. Members see their own.
export async function GET() {
  await connection();
  const s = await getSession();
  if (!s) return bad("Please log in.", 401);
  const claims = await getClaims();
  if (s.user.role === "treasurer" && s.org) return Response.json(claims.filter((c) => c.orgId === s.org!.id));
  return Response.json(claims.filter((c) => c.userId === s.user.id));
}

function cleanReceipt(x: unknown): Receipt | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  if (typeof r.vendor !== "string" || typeof r.total !== "number" || !Number.isFinite(r.total) || r.total <= 0 || r.total > 100_000) return null;
  if (typeof r.category !== "string" || !(CATEGORY_KEYS as readonly string[]).includes(r.category)) return null;
  if (r.date !== null && !(typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date))) return null;
  const items = Array.isArray(r.line_items) ? r.line_items : [];
  return {
    vendor: r.vendor.trim().slice(0, 120) || "Unknown vendor",
    date: r.date as string | null,
    total: Math.round(r.total * 100) / 100,
    currency: typeof r.currency === "string" ? r.currency.slice(0, 3).toUpperCase() : "USD",
    category: r.category as Receipt["category"],
    contains_alcohol: r.contains_alcohol === true,
    line_items: items
      .filter((i): i is { description: string; amount: number } => !!i && typeof i.description === "string" && typeof i.amount === "number")
      .slice(0, 50)
      .map((i) => ({ description: i.description.slice(0, 120), amount: i.amount })),
    needs_review: r.needs_review === true,
    review_reason: typeof r.review_reason === "string" ? r.review_reason.slice(0, 240) : null,
  };
}

const sameReceipt = (a: Receipt, b: Receipt) =>
  a.vendor.trim().toLowerCase() === b.vendor.trim().toLowerCase() && a.date === b.date && Math.round(a.total * 100) === Math.round(b.total * 100);

export async function POST(req: Request) {
  const auth = await requireMember();
  if (!auth.ok) return auth.response;
  const b = await readJson(req);
  if (!b) return bad("Something went wrong. Please try again.");

  // Which organization is this for?
  const approved = (await read<Membership>("memberships")).filter((m) => m.userId === auth.user.id && m.status === "approved");
  if (approved.length === 0) return bad("You can submit receipts once an organization approves you.", 403);
  const orgId = text(b.orgId, 64) || (approved.length === 1 ? approved[0].orgId : "");
  if (!approved.some((m) => m.orgId === orgId)) return bad("Choose which organization this receipt is for.");
  const org = await getOrg(orgId);
  if (!org) return bad("Organization not found.", 404);

  // The receipt must be the one our reader produced, unchanged.
  if (!verifyReceipt(b.receipt, b.receiptToken, auth.user.id)) return bad("Please upload the receipt again.");
  const receipt = cleanReceipt(b.receipt);
  if (!receipt) return bad("That receipt didn't look right. Please upload it again.");

  let { decision, rule, payAmount } = evaluate(receipt, org.rules);
  if (decision === "auto_approve" && receipt.currency !== "USD") {
    decision = "needs_review";
    rule = "This receipt isn't in US dollars";
  }
  if (decision !== "auto_approve") payAmount = undefined;

  const claim: Claim = {
    id: randomUUID(),
    orgId: org.id,
    userId: auth.user.id,
    memberName: auth.user.name,
    memberEmail: auth.user.paypalEmail ?? auth.user.email,
    receipt,
    decision,
    rule,
    ...(payAmount !== undefined ? { payAmount } : {}),
    ...((await ownsImage(b.imageId, auth.user.id)) ? { imageId: b.imageId as string } : {}),
    status: decision === "reject" ? "rejected" : "pending_review",
    createdAt: new Date().toISOString(),
  };

  // Save first, and catch repeats inside the same step, so a double click can't pay twice.
  await update<Claim>("claims", (rows) => {
    const repeat = rows.some(
      (c) => c.orgId === org.id && c.userId === auth.user.id && c.status !== "rejected" && c.status !== "denied" && sameReceipt(c.receipt, receipt)
    );
    if (repeat && claim.decision === "auto_approve") {
      claim.decision = "needs_review";
      claim.rule = "This looks like a receipt that was already submitted";
      delete claim.payAmount;
    }
    rows.unshift(claim);
  });

  if (claim.decision === "auto_approve") {
    let paid: { batch?: string; failed?: boolean };
    try {
      paid = { batch: await sendPayout(claim.memberEmail, amountToPay(claim), `Pockit: ${receipt.vendor}`) };
    } catch (err) {
      console.error("Payout failed:", err);
      paid = { failed: true };
    }
    await updateClaim(claim.id, (c) => {
      if (paid.failed) c.status = "payout_failed";
      else {
        c.status = "paid";
        c.payoutBatchId = paid.batch;
      }
    });
    claim.status = paid.failed ? "payout_failed" : "paid";
    claim.payoutBatchId = paid.batch;
  }

  await textMemberAboutClaim(claim, org, "rules");
  await textTreasurerAboutClaim(claim, org);
  return Response.json(claim);
}
