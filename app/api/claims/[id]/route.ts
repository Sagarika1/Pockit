import { sendPayout } from "@/lib/paypal";
import { getClaims, saveClaims } from "@/lib/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = (await req.json()) as { action: "approve" | "deny" };

  const claims = await getClaims();
  const claim = claims.find((c) => c.id === id);
  if (!claim) return Response.json({ error: "Claim not found" }, { status: 404 });

  if (claim.status !== "pending_review")
    return Response.json({ error: `Claim is already ${claim.status}` }, { status: 400 });

  if (action === "deny") {
    claim.status = "denied";
  } else {
    try {
      claim.payoutBatchId = await sendPayout(
        claim.memberEmail,
        claim.receipt.total,
        `Pockit: ${claim.receipt.vendor} (treasurer approved)`
      );
      claim.status = "paid";
    } catch {
      claim.status = "payout_failed";
    }
  }

  claim.reviewedAt = new Date().toISOString();
  await saveClaims(claims);
  return Response.json(claim);
}