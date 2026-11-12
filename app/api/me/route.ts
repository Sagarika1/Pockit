import { connection } from "next/server";
import { ensureDemoSeed } from "@/lib/seed";
import { getSession } from "@/lib/auth";
import { isDemoReader } from "@/lib/demoReader";
import { read, publicUser, type Membership, type Org } from "@/lib/db";

export async function GET() {
  await connection();
  await ensureDemoSeed();
  const s = await getSession();
  if (!s) return Response.json({ user: null, demo: process.env.SEED_DEMO === "true" }); // demo = show the demo logins

  if (s.user.role === "treasurer")
    return Response.json({
      user: publicUser(s.user),
      org: s.org && { id: s.org.id, name: s.org.name, type: s.org.type },
      demoReader: isDemoReader(),
    });

  const orgs = await read<Org>("orgs");
  const memberships = (await read<Membership>("memberships"))
    .filter((m) => m.userId === s.user.id && m.status !== "removed")
    .map((m) => ({
      id: m.id,
      orgId: m.orgId,
      orgName: orgs.find((o) => o.id === m.orgId)?.name ?? "Unknown organization",
      kind: m.kind,
      status: m.status,
    }));
  return Response.json({ user: publicUser(s.user), memberships, demoReader: isDemoReader() });
}
