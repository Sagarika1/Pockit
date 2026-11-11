import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "pockit_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("Set SESSION_SECRET in your environment.");
  return "pockit-dev-only-secret-please-set-SESSION_SECRET";
}

function mac(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A signed "who is logged in" value for the cookie. Can't be forged without SESSION_SECRET. */
export function signSession(userId: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: now + SESSION_MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${mac(payload)}`;
}

export function verifySession(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, mac(payload))) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof uid === "string" && typeof exp === "number" && exp > now ? uid : null;
  } catch {
    return null;
  }
}

// A receipt that was read by the AI gets a signature, so a member can't edit the numbers
// (or invent a receipt) before submitting. The claim route checks it.
const RECEIPT_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

function canonical(receipt: unknown): string {
  const r = receipt as Record<string, unknown>;
  return JSON.stringify([r.vendor, r.date, r.total, r.currency, r.category, r.contains_alcohol, r.needs_review, r.review_reason ?? null]);
}

export function signReceipt(receipt: unknown, userId: string, now = Date.now()): string {
  const issued = String(now);
  return `${issued}.${mac(`receipt|${userId}|${issued}|${canonical(receipt)}`)}`;
}

export function verifyReceipt(receipt: unknown, token: unknown, userId: string, now = Date.now()): boolean {
  if (typeof token !== "string") return false;
  const [issued, sig] = token.split(".");
  const t = Number(issued);
  if (!issued || !sig || !Number.isFinite(t) || now - t > RECEIPT_MAX_AGE_MS || t > now + 60_000) return false;
  return safeEqual(sig, mac(`receipt|${userId}|${issued}|${canonical(receipt)}`));
}
