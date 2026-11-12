import { read, update } from "./db";
import type { Receipt, Decision } from "./policy";

export type Claim = {
  id: string;
  orgId?: string; // older test claims won't have one
  userId?: string;
  memberName: string;
  memberEmail: string; // the PayPal address the money goes to
  receipt: Receipt;
  decision: Decision["decision"];
  rule: string;
  status: "paid" | "pending_review" | "rejected" | "denied" | "payout_failed";
  payAmount?: number; // set when less than the receipt total is (or will be) paid
  payoutBatchId?: string;
  imageId?: string; // the saved receipt photo, if there is one
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
};

/** What this claim pays (or paid): the receipt total, unless it was reduced to a limit. */
export const amountToPay = (c: Pick<Claim, "payAmount" | "receipt">) => c.payAmount ?? c.receipt.total;

export async function getClaims(): Promise<Claim[]> {
  return read<Claim>("claims");
}

export async function saveClaims(claims: Claim[]) {
  await update<Claim>("claims", (rows) => {
    rows.splice(0, rows.length, ...claims);
  });
}

/** Change one claim safely. */
export async function updateClaim(id: string, fn: (c: Claim) => void): Promise<Claim | undefined> {
  return update<Claim, Claim | undefined>("claims", (rows) => {
    const c = rows.find((x) => x.id === id);
    if (c) fn(c);
    return c;
  });
}
