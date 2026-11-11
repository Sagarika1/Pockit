import { requireTreasurer } from "@/lib/auth";
import { bad, readJson } from "@/lib/http";
import { textMemberAboutClaim, textTreasurerAboutClaim } from "@/lib/notify";
import { sendPayout } from "@/lib/paypal";
import { getClaims, updateClaim } from "@/lib/store";

const inFlight = new Set<string>(); // stops a double click from paying twice

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTreasurer();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const b = await readJson(req);
  const action = b?.action;
  if (action !== "approve" && action !== "deny") return bad("Unknown action.");

  const existing = (await getClaims()).find((c) => c.id === id && c.orgId === auth.org.id);
  if (!existing) return bad("Claim not found.", 404);
  if (existing.status !== "pending_review") return bad(`This claim is already ${existing.status.replace("_", " ")}.`);
  if (inFlight.has(id)) return bad("This claim is already being processed.", 409);
  inFlight.add(id);

  try {
    let payoutBatchId: string | undefined;
    let status: "paid" | "denied" | "payout_failed" = "denied";
    if (action === "approve") {
      try {
        payoutBatchId = await sendPayout(existing.memberEmail, existing.receipt.total, `Pockit: ${existing.receipt.vendor} (treasurer approved)`);
        status = "paid";
      } catch (err) {
        console.error("Payout failed:", err);
        status = "payout_failed";
      }
    }
    const claim = await updateClaim(id, (c) => {
      c.status = status;
      if (payoutBatchId) c.payoutBatchId = payoutBatchId;
      c.reviewedAt = new Date().toISOString();
      c.reviewedBy = auth.user.name;
    });
    if (claim) {
      await textMemberAboutClaim(claim, auth.org, "treasurer");
      if (claim.status === "payout_failed") await textTreasurerAboutClaim(claim, auth.org);
    }
    return Response.json(claim);
  } finally {
    inFlight.delete(id);
  }
}
