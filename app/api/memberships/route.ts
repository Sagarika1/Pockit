import { randomUUID } from "crypto";
import { requireMember } from "@/lib/auth";
import { getOrg, update, type MemberKind, type Membership } from "@/lib/db";
import { bad, readJson, text } from "@/lib/http";
import { textTreasurerAboutApplicant } from "@/lib/notify";

const KINDS: MemberKind[] = ["student", "employee", "volunteer"];

// A logged-in member asks to join another organization (or tries again after a "no").
export async function POST(req: Request) {
  const auth = await requireMember();
  if (!auth.ok) return auth.response;
  const b = await readJson(req);
  const orgId = text(b?.orgId, 64);
  const kind = b?.kind as MemberKind;
  const org = await getOrg(orgId);
  if (!org) return bad("Choose an organization.");
  if (!KINDS.includes(kind)) return bad("Choose whether you're a student, employee or volunteer.");

  const result = await update<Membership, "created" | "exists">("memberships", (rows) => {
    const existing = rows.find((m) => m.orgId === org.id && m.userId === auth.user.id);
    if (existing && (existing.status === "pending" || existing.status === "approved")) return "exists";
    if (existing) {
      existing.status = "pending";
      existing.kind = kind;
      existing.addedBy = "self";
      delete existing.decidedAt;
    } else {
      rows.push({ id: randomUUID(), orgId: org.id, userId: auth.user.id, kind, status: "pending", addedBy: "self", createdAt: new Date().toISOString() });
    }
    return "created";
  });
  if (result === "exists") return bad("You've already asked to join this organization.", 409);

  await textTreasurerAboutApplicant(org, auth.user);
  return Response.json({ ok: true });
}
