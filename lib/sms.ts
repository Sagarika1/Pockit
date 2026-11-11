import { randomUUID } from "crypto";
import { update, type SmsLog } from "./db";

/** "(404) 555-0123" -> "+14045550123". Returns null if it doesn't look like a real number. */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function maskPhone(p: string) {
  return p.length > 4 ? `•••${p.slice(-4)}` : p;
}

/** "live" sends real texts through Twilio. "demo" only records them so you can show them on screen. */
export function smsMode(): "live" | "demo" {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, TWILIO_MESSAGING_SERVICE_SID } = process.env;
  return TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && (TWILIO_FROM || TWILIO_MESSAGING_SERVICE_SID) ? "live" : "demo";
}

async function record(entry: Omit<SmsLog, "id" | "createdAt">) {
  await update<SmsLog>("sms-log", (rows) => {
    rows.unshift({ id: randomUUID(), createdAt: new Date().toISOString(), ...entry });
    if (rows.length > 200) rows.length = 200;
  });
}

/** Never throws: a failed text must not break a reimbursement. */
export async function sendSms(rawTo: string | null | undefined, body: string, orgId?: string): Promise<void> {
  try {
    const to = normalizePhone(rawTo);
    if (!to) return record({ to: "(no phone number)", body, status: "skipped", orgId });

    if (smsMode() === "demo") {
      console.log(`[SMS demo] to ${to}: ${body}`);
      return record({ to, body, status: "demo", orgId });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID as string;
    const token = process.env.TWILIO_AUTH_TOKEN as string;
    const form = new URLSearchParams({ To: to, Body: body });
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) form.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
    else form.set("From", process.env.TWILIO_FROM as string);

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) return record({ to, body, status: "sent", orgId });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    console.error("Twilio error:", res.status, data.message);
    return record({ to, body, status: "failed", error: data.message ?? `Twilio returned ${res.status}`, orgId });
  } catch (err) {
    console.error("SMS error:", err);
    try {
      await record({ to: String(rawTo ?? ""), body, status: "failed", error: err instanceof Error ? err.message : "Unknown error", orgId });
    } catch {}
  }
}
