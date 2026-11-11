import { connection } from "next/server";
import { evaluate, Receipt } from "@/lib/policy";
import { sendPayout } from "@/lib/paypal";
import { getClaims, saveClaims, Claim } from "@/lib/store";

export async function GET() {
  await connection();
  return Response.json(await getClaims());
}

export async function POST(req: Request) {
  const { memberName, memberEmail, receipt } = (await req.json()) as {
    memberName: string;
    memberEmail: string;
    receipt: Receipt;
  };

  const { decision, rule } = evaluate(receipt);

  const claim: Claim = {
    id: crypto.randomUUID(),
    memberName,
    memberEmail,
    receipt,
    decision,
    rule,
    status: decision === "reject" ? "rejected" : "pending_review",
    createdAt: new Date().toISOString(),
  };

  if (decision === "auto_approve") {
    try {
      claim.payoutBatchId = await sendPayout(memberEmail, receipt.total, `Pockit: ${receipt.vendor}`);
      claim.status = "paid";
    } catch {
      claim.status = "payout_failed";
    }
  }

  const claims = await getClaims();
  claims.unshift(claim);
  await saveClaims(claims);

  return Response.json(claim);
}