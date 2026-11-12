import { startSession } from "@/lib/auth";
import { ensureDemoSeed } from "@/lib/seed";
import { findUserByEmail } from "@/lib/db";
import { bad, readJson, text } from "@/lib/http";
import { verifyPassword } from "@/lib/password";

// Slows down password guessing: 10 tries per email per 15 minutes (resets if the server restarts).
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  await ensureDemoSeed();
  const b = await readJson(req);
  if (!b) return bad("Something went wrong. Please try again.");
  const email = text(b.email, 254).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const as = b.as === "treasurer" || b.as === "member" ? b.as : null;
  if (!email || !password) return bad("Enter your email and password.");

  const now = Date.now();
  const a = attempts.get(email);
  if (a && a.resetAt > now && a.count >= 10) return bad("Too many tries. Wait a few minutes and try again.", 429);

  const user = await findUserByEmail(email);
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    attempts.set(email, { count: a && a.resetAt > now ? a.count + 1 : 1, resetAt: a && a.resetAt > now ? a.resetAt : now + 15 * 60_000 });
    return bad("That email and password don't match.", 401);
  }
  attempts.delete(email);

  if (as && as !== user.role)
    return bad(
      user.role === "member"
        ? "That's a member account. Use the Member tab to log in."
        : "That's an organization account. Use the Organization tab to log in.",
      403
    );

  await startSession(user.id);
  return Response.json({ ok: true, role: user.role });
}
