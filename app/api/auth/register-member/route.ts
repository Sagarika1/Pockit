import { randomUUID } from "crypto";
import { startSession } from "@/lib/auth";
import { getOrg, isEmail, update, type MemberKind, type Membership, type User } from "@/lib/db";
import { bad, readJson, text } from "@/lib/http";
import { textTreasurerAboutApplicant } from "@/lib/notify";
import { hashPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/sms";

const KINDS: MemberKind[] = ["student", "employee", "volunteer"];

export async function POST(req: Request) {
  const b = await readJson(req);
  if (!b) return bad("Something went wrong. Please try again.");

  const name = text(b.name, 100);
  const email = text(b.email, 254).toLowerCase();
  const paypalEmail = (text(b.paypalEmail, 254) || email).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const phoneRaw = text(b.phone, 30);
  const kind = b.kind as MemberKind;
  const orgId = text(b.orgId, 64);

  if (!name) return bad("Enter your name.");
  if (!isEmail(email)) return bad("Enter a valid email address.");
  if (!isEmail(paypalEmail)) return bad("Enter the email of your PayPal account.");
  if (password.length < 8) return bad("Your password needs at least 8 characters.");
  if (phoneRaw && !normalizePhone(phoneRaw)) return bad("Enter a 10-digit phone number, or leave it blank.");
  if (!KINDS.includes(kind)) return bad("Choose whether you're a student, employee or volunteer.");
  const org = await getOrg(orgId);
  if (!org) return bad("Choose the organization you want to join.");

  const user: User = {
    id: randomUUID(),
    role: "member",
    name,
    email,
    phone: phoneRaw ? (normalizePhone(phoneRaw) as string) : undefined,
    paypalEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  const created = await update<User, boolean>("users", (rows) => {
    if (rows.some((u) => u.email === email)) return false;
    rows.push(user);
    return true;
  });
  if (!created) return bad("There's already an account with that email. Log in, then ask to join from the Submit page.", 409);

  const membership: Membership = {
    id: randomUUID(),
    orgId: org.id,
    userId: user.id,
    kind,
    status: "pending",
    addedBy: "self",
    createdAt: new Date().toISOString(),
  };
  await update<Membership>("memberships", (rows) => {
    rows.push(membership);
  });

  await startSession(user.id);
  await textTreasurerAboutApplicant(org, user);
  return Response.json({ ok: true, role: "member" });
}
