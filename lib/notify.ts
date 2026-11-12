import { getTreasurer, getUser, type Membership, type Org, type User } from "./db";
import { CATEGORY_LABEL } from "./rules";
import { sendSms } from "./sms";
import { amountToPay, type Claim } from "./store";

const usd = (n: number) => `$${n.toFixed(2)}`;
const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Text the member about what happened to their request. */
export async function textMemberAboutClaim(claim: Claim, org: Org, decidedBy: "rules" | "treasurer") {
  const member = claim.userId ? await getUser(claim.userId) : undefined;
  if (!member) return;
  const amount = usd(claim.receipt.total);
  const paid = usd(amountToPay(claim));
  const partial = Math.round(amountToPay(claim) * 100) < Math.round(claim.receipt.total * 100);
  const v = claim.receipt.vendor;
  let body: string;
  switch (claim.status) {
    case "paid":
      body =
        decidedBy === "rules"
          ? partial
            ? `Pockit: Your reimbursement request was approved! ${paid} of your ${amount} for ${v} is on its way to your PayPal. That's the limit for ${CATEGORY_LABEL[claim.receipt.category].toLowerCase()}.`
            : `Pockit: Your reimbursement request was approved! ${amount} for ${v} is on its way to your PayPal.`
          : partial
            ? `Pockit: Good news! ${org.name} approved ${paid} of your ${amount} request for ${v}. It's on its way to your PayPal.`
            : `Pockit: Good news! ${org.name} approved your ${amount} request for ${v}. It's on its way to your PayPal.`;
      break;
    case "pending_review":
      body = `Pockit: We got your ${amount} receipt from ${v}. ${org.name}'s treasurer will take a look. ${sentence(claim.rule)} We'll text you when it's decided.`;
      break;
    case "rejected":
      body = `Pockit: Your ${amount} request for ${v} wasn't approved. ${sentence(claim.rule)}`;
      break;
    case "denied":
      body = `Pockit: ${org.name} didn't approve your ${amount} request for ${v}. Ask your treasurer if you have questions.`;
      break;
    default:
      body = `Pockit: Your ${amount} request for ${v} was approved, but the PayPal payment didn't go through. Your treasurer has been told.`;
  }
  await sendSms(member.phone, body, org.id);
}

/** Text the treasurer when something needs them. */
export async function textTreasurer(org: Org, body: string) {
  const t = await getTreasurer(org.id);
  if (t) await sendSms(t.phone, `Pockit: ${body}`, org.id);
}

export async function textTreasurerAboutClaim(claim: Claim, org: Org) {
  const amount = usd(claim.receipt.total);
  if (claim.status === "payout_failed")
    return textTreasurer(org, `The PayPal payment to ${claim.memberName} (${amount}) failed. Open Pockit to check.`);
  if (claim.status === "pending_review")
    return textTreasurer(org, `${claim.memberName} submitted ${amount} at ${claim.receipt.vendor}. It needs your review: ${sentence(claim.rule)}`);
}

export async function textTreasurerAboutApplicant(org: Org, member: User) {
  return textTreasurer(org, `${member.name} wants to join ${org.name}. Open Pockit > People to approve them.`);
}

export async function textMemberAboutMembership(org: Org, member: User, m: Membership, how: "approved" | "denied" | "added") {
  const body =
    how === "approved"
      ? `Pockit: You're in! ${org.name} approved your request. You can now submit receipts at ${appUrl()}/submit`
      : how === "denied"
        ? `Pockit: ${org.name} wasn't able to approve your request to join. Reach out to your treasurer if you think this is a mistake.`
        : `Pockit: ${org.name} added you as a ${m.kind}. Log in with your email at ${appUrl()}/login to submit receipts.`;
  await sendSms(member.phone, body, org.id);
}
