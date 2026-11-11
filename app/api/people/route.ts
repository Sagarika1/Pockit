import { randomBytes, randomUUID } from "crypto";
import { connection } from "next/server";
import { requireTreasurer } from "@/lib/auth";
import { isEmail, read, update, type MemberKind, type Membership, type User } from "@/lib/db";
import { bad, readJson, text } from "@/lib/http";
import { textMemberAboutMembership } from "@/lib/notify";
import { hashPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/sms";

const KINDS: MemberKind[] = ["student", "employee", "volunteer"];

export async function GET() {
  await connection();
  const auth = await requireTreasurer();
  if (!auth.ok) return auth.response;
  const users = await read<User>("users");
  const rows = (await read<Membership>("memberships"))
    .filter((m) => m.orgId === auth.org.id)
    .map((m) => {
      const u = users.find((x) => x.id === m.userId);
      return {
        id: m.id,
        name: u?.name ?? "Unknown",
        email: u?.email ?? "",
        phone: u?.phone ?? null,
        paypalEmail: u?.paypalEmail ?? null,
        kind: m.kind,
        status: m.status,
        addedBy: m.addedBy,
        createdAt: m.createdAt,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Response.json(rows);
}

// The treasurer adds someone directly (no application needed).
export async function POST(req: Request) {
  const auth = await requireTreasurer();
  if (!auth.ok) return auth.response;
  const b = await readJson(req);
  if (!b) return bad("Something went wrong. Please try again.");

  const name = text(b.name, 100);
  const email = text(b.email, 254).toLowerCase();
  const paypalEmail = (text(b.paypalEmail, 254) || email).toLowerCase();
  const phoneRaw = text(b.phone, 30);
  const kind = b.kind as MemberKind;
  const givenPassword = typeof b.password === "string" ? b.password : "";

  if (!name) return bad("Enter their name.");
  if (!isEmail(email)) return bad("Enter a valid email address.");
  if (!isEmail(paypalEmail)) return bad("Enter a valid PayPal email.");
  if (phoneRaw && !normalizePhone(phoneRaw)) return bad("Enter a 10-digit phone number, or leave it blank.");
  if (!KINDS.includes(kind)) return bad("Choose student, employee or volunteer.");
  if (givenPassword && givenPassword.length < 8) return bad("A password needs at least 8 characters.");

  const users = await read<User>("users");
  let user = users.find((u) => u.email === email);
  let tempPassword: string | undefined;

  if (user && user.role !== "member") return bad("That email belongs to an organization account.", 409);

  if (!user) {
    tempPassword = givenPassword || randomBytes(4).toString("hex");
    const created: User = {
      id: randomUUID(),
      role: "member",
      name,
      email,
      phone: phoneRaw ? (normalizePhone(phoneRaw) as string) : undefined,
      paypalEmail,
      passwordHash: await hashPassword(tempPassword),
      createdAt: new Date().toISOString(),
    };
    const ok = await update<User, boolean>("users", (rows) => {
      if (rows.some((u) => u.email === email)) return false;
      rows.push(created);
      return true;
    });
    if (!ok) return bad("That email was just taken. Try again.", 409);
    user = created;
  }

  const userId = user.id;
  const membership = await update<Membership, Membership | "already">("memberships", (rows) => {
    const existing = rows.find((m) => m.orgId === auth.org.id && m.userId === userId);
    if (existing?.status === "approved") return "already";
    const now = new Date().toISOString();
    if (existing) {
      Object.assign(existing, { status: "approved", kind, addedBy: "treasurer", decidedAt: now });
      return existing;
    }
    const m: Membership = { id: randomUUID(), orgId: auth.org.id, userId, kind, status: "approved", addedBy: "treasurer", createdAt: now, decidedAt: now };
    rows.push(m);
    return m;
  });
  if (membership === "already") return bad(`${user.name} is already in your organization.`, 409);

  await textMemberAboutMembership(auth.org, user, membership, "added");
  return Response.json({ ok: true, name: user.name, tempPassword });
}
