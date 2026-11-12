import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { bad } from "@/lib/http";
import { loadReceiptImage } from "@/lib/receiptImages";
import { getClaims } from "@/lib/store";

// The receipt photo for one claim. Only that claim's treasurer or the member who submitted it can open it.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  const s = await getSession();
  if (!s) return bad("Please log in.", 401);
  const { id } = await params;
  const claim = (await getClaims()).find((c) => c.id === id);
  const allowed = claim && (s.user.role === "treasurer" ? !!s.org && claim.orgId === s.org.id : claim.userId === s.user.id);
  if (!claim || !allowed || !claim.imageId) return bad("No photo for this receipt.", 404);
  const img = await loadReceiptImage(claim.imageId);
  if (!img) return bad("No photo for this receipt.", 404);
  return new Response(new Uint8Array(img.bytes), { headers: { "Content-Type": img.mime, "Cache-Control": "private, no-store" } });
}
