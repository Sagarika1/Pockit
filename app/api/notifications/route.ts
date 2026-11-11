import { connection } from "next/server";
import { requireTreasurer } from "@/lib/auth";
import { read, type SmsLog } from "@/lib/db";
import { maskPhone, smsMode } from "@/lib/sms";

export async function GET() {
  await connection();
  const auth = await requireTreasurer();
  if (!auth.ok) return auth.response;
  const rows = (await read<SmsLog>("sms-log"))
    .filter((s) => s.orgId === auth.org.id)
    .slice(0, 12)
    .map((s) => ({ id: s.id, to: s.to.startsWith("+") ? maskPhone(s.to) : s.to, body: s.body, status: s.status, error: s.error, createdAt: s.createdAt }));
  return Response.json({ mode: smsMode(), messages: rows });
}
