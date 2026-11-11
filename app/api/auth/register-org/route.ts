import { randomUUID } from "crypto";
import { startSession } from "@/lib/auth";
import { isEmail, update, type Org, type OrgType, type User } from "@/lib/db";
import { bad, readJson, text } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { defaultRules } from "@/lib/rules";
import { normalizePhone } from "@/lib/sms";

const TYPES: OrgType[] = ["school_club", "nonprofit", "volunteer"];

export async function POST(req: Request) {
  const b = await readJson(req);
  if (!b) return bad("Something went wrong. Please try again.");

  const orgName = text(b.orgName, 100);
  const name = text(b.name, 100);
  const email = text(b.email, 254).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const type = b.orgType as OrgType;
  const phoneRaw = text(b.phone, 30);
  const paypalBusinessEmail = text(b.paypalBusinessEmail, 254).toLowerCase();

  if (orgName.length < 2) return bad("Enter your organization's name.");
  if (!TYPES.includes(type)) return bad("Choose what kind of organization this is.");
  if (!name) return bad("Enter your name.");
  if (!isEmail(email)) return bad("Enter a valid email address.");
  if (password.length < 8) return bad("Your password needs at least 8 characters.");
  if (phoneRaw && !normalizePhone(phoneRaw)) return bad("Enter a 10-digit phone number, or leave it blank.");
  if (paypalBusinessEmail && !isEmail(paypalBusinessEmail)) return bad("Enter a valid PayPal business email, or leave it blank.");

  const orgId = randomUUID();
  const user: User = {
    id: randomUUID(),
    role: "treasurer",
    name,
    email,
    phone: phoneRaw ? (normalizePhone(phoneRaw) as string) : undefined,
    orgId,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  const created = await update<User, boolean>("users", (rows) => {
    if (rows.some((u) => u.email === email)) return false;
    rows.push(user);
    return true;
  });
  if (!created) return bad("There's already an account with that email. Try logging in.", 409);

  const org: Org = {
    id: orgId,
    name: orgName,
    type,
    paypalBusinessEmail: paypalBusinessEmail || undefined,
    rules: defaultRules(),
    createdAt: new Date().toISOString(),
  };
  await update<Org>("orgs", (rows) => {
    rows.push(org);
  });

  await startSession(user.id);
  return Response.json({ ok: true, role: "treasurer" });
}
