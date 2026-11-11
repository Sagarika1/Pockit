import { connection } from "next/server";
import { getSession, requireTreasurer } from "@/lib/auth";
import { getOrg, read, update, type Membership, type Org } from "@/lib/db";
import { bad, readJson } from "@/lib/http";
import { sanitizeRules } from "@/lib/rules";

// Treasurers get their own rules. Approved members can read the rules of an organization they belong to.
export async function GET(req: Request) {
  await connection();
  const s = await getSession();
  if (!s) return bad("Please log in.", 401);
  if (s.user.role === "treasurer" && s.org) return Response.json({ orgName: s.org.name, rules: s.org.rules });

  const orgId = new URL(req.url).searchParams.get("orgId") ?? "";
  const isMember = (await read<Membership>("memberships")).some(
    (m) => m.userId === s.user.id && m.orgId === orgId && m.status === "approved"
  );
  if (!isMember) return bad("You don't have access to that.", 403);
  const org = await getOrg(orgId);
  if (!org) return bad("Organization not found.", 404);
  return Response.json({ orgName: org.name, rules: org.rules });
}

export async function PUT(req: Request) {
  const auth = await requireTreasurer();
  if (!auth.ok) return auth.response;
  const b = await readJson(req);
  if (!b) return bad("Something went wrong. Please try again.");
  const rules = sanitizeRules(b, auth.org.rules);
  await update<Org>("orgs", (rows) => {
    const o = rows.find((x) => x.id === auth.org.id);
    if (o) o.rules = rules;
  });
  return Response.json({ ok: true, rules });
}
