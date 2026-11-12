// Demo accounts. Only runs when SEED_DEMO=true and the app has no accounts yet.
// Free hosting often wipes files on restart, so this puts the demo back by itself.
import { randomUUID } from "crypto";
import { read, update, type Membership, type Org, type User } from "./db";
import { hashPassword } from "./password";
import type { Receipt } from "./policy";
import { defaultRules } from "./rules";
import type { Claim } from "./store";

export const DEMO_PASSWORD = "pockit-demo-2026";
export const DEMO_TREASURER_EMAIL = "demo-treasurer@pockit.demo";
export const DEMO_MEMBER_EMAIL = "demo-member@pockit.demo";
export const DEMO_APPLICANT_EMAIL = "demo-applicant@pockit.demo";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const dateAgo = (n: number) => daysAgo(n).slice(0, 10);

function receipt(vendor: string, total: number, category: Receipt["category"], n: number, extra: Partial<Receipt> = {}): Receipt {
  return { vendor, date: dateAgo(n), total, currency: "USD", category, contains_alcohol: false, line_items: [], needs_review: false, review_reason: null, ...extra };
}

async function run() {
  if ((await read<User>("users")).length > 0) return;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const orgId = randomUUID();
  const treasurer: User = { id: randomUUID(), role: "treasurer", name: "Taylor Treasurer", email: DEMO_TREASURER_EMAIL, orgId, passwordHash, createdAt: daysAgo(14) };
  const member: User = {
    id: randomUUID(),
    role: "member",
    name: "Maya Member",
    email: DEMO_MEMBER_EMAIL,
    // Set DEMO_MEMBER_PAYPAL_EMAIL to a PayPal sandbox personal account to see real sandbox payments land
    paypalEmail: (process.env.DEMO_MEMBER_PAYPAL_EMAIL || DEMO_MEMBER_EMAIL).toLowerCase(),
    passwordHash,
    createdAt: daysAgo(13),
  };
  const applicant: User = { id: randomUUID(), role: "member", name: "Alex Applicant", email: DEMO_APPLICANT_EMAIL, paypalEmail: DEMO_APPLICANT_EMAIL, passwordHash, createdAt: daysAgo(1) };

  const org: Org = { id: orgId, name: "Demo Robotics Club", type: "school_club", rules: defaultRules(), createdAt: daysAgo(14) };
  const memberships: Membership[] = [
    { id: randomUUID(), orgId, userId: member.id, kind: "student", status: "approved", addedBy: "self", createdAt: daysAgo(13), decidedAt: daysAgo(13) },
    { id: randomUUID(), orgId, userId: applicant.id, kind: "student", status: "pending", addedBy: "self", createdAt: daysAgo(1) },
  ];

  const base = { orgId, userId: member.id, memberName: member.name, memberEmail: member.paypalEmail as string };
  const claims: Claim[] = [
    { ...base, id: randomUUID(), receipt: receipt("Campus Pizza Co", 18.4, "meals", 9), decision: "auto_approve", rule: "Within the $50 limit for meals", status: "paid", payoutBatchId: "DEMO-BATCH-1", createdAt: daysAgo(9) },
    { ...base, id: randomUUID(), receipt: receipt("RideWay", 52, "rideshare", 8), decision: "auto_approve", rule: "Paid $40 of $52. The limit for rideshare is $40", payAmount: 40, status: "paid", payoutBatchId: "DEMO-BATCH-2", createdAt: daysAgo(8) },
    { ...base, id: randomUUID(), receipt: receipt("Lakeside Bar & Grill", 36.2, "meals", 6, { contains_alcohol: true }), decision: "reject", rule: "Alcohol can't be reimbursed", status: "rejected", createdAt: daysAgo(6) },
    { ...base, id: randomUUID(), receipt: receipt("Print Shop on Main", 64, "other", 4), decision: "needs_review", rule: "Other needs treasurer approval", status: "paid", payoutBatchId: "DEMO-BATCH-3", reviewedAt: daysAgo(3), reviewedBy: treasurer.name, createdAt: daysAgo(4) },
    { ...base, id: randomUUID(), receipt: receipt("Summit Parking Garage", 33, "other", 1), decision: "needs_review", rule: "Other needs treasurer approval", status: "pending_review", createdAt: daysAgo(1) },
  ];

  await update<User>("users", (rows) => void rows.push(treasurer, member, applicant));
  await update<Org>("orgs", (rows) => void rows.push(org));
  await update<Membership>("memberships", (rows) => void rows.push(...memberships));
  await update<Claim>("claims", (rows) => void rows.push(...claims));
}

let seeding: Promise<void> | null = null;

/** Safe to call on every request. Does nothing unless SEED_DEMO=true and there are no accounts. */
export function ensureDemoSeed(): Promise<void> {
  if (process.env.SEED_DEMO !== "true") return Promise.resolve();
  seeding ??= run().catch((err) => {
    console.error("Demo seed failed:", err);
    seeding = null;
  });
  return seeding;
}
