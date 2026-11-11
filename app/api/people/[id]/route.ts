import { requireTreasurer } from "@/lib/auth";
import { getUser, update, type Membership } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { textMemberAboutMembership } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTreasurer();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const b = await readJson(req);
  const action = b?.action;
  if (action !== "approve" && action !== "deny" && action !== "remove") return bad("Unknown action.");

  const result = await update<Membership, Membership | "missing" | "invalid">("memberships", (rows) => {
    const m = rows.find((x) => x.id === id && x.orgId === auth.org.id);
    if (!m) return "missing";
    const now = new Date().toISOString();
    if (action === "approve" && (m.status === "pending" || m.status === "denied")) m.status = "approved";
    else if (action === "deny" && m.status === "pending") m.status = "denied";
    else if (action === "remove" && m.status === "approved") m.status = "removed";
    else return "invalid";
    m.decidedAt = now;
    return m;
  });
  if (result === "missing") return bad("Person not found.", 404);
  if (result === "invalid") return bad("That person has already been handled.", 400);

  const member = await getUser(result.userId);
  if (member && action !== "remove")
    await textMemberAboutMembership(auth.org, member, result, action === "approve" ? "approved" : "denied");
  return Response.json({ ok: true, status: result.status });
}
