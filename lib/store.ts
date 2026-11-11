import { promises as fs } from "fs";
import path from "path";
import type { Receipt, Decision } from "./policy";

export type Claim = {
  id: string;
  memberName: string;
  memberEmail: string;
  receipt: Receipt;
  decision: Decision["decision"];
  rule: string;
  status: "paid" | "pending_review" | "rejected" | "denied" | "payout_failed";
  payoutBatchId?: string;
   reviewedAt?: string;
  createdAt: string;
};

const FILE = path.join(process.cwd(), "data", "claims.json");

export async function getClaims(): Promise<Claim[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function saveClaims(claims: Claim[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(claims, null, 2));
}