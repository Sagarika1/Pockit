import { connection } from "next/server";
import { ensureDemoSeed } from "@/lib/seed";
import { read, type Org } from "@/lib/db";

// Public: lets someone pick the organization they want to join.
export async function GET() {
  await connection();
  await ensureDemoSeed();
  const orgs = await read<Org>("orgs");
  return Response.json(
    orgs
      .map((o) => ({ id: o.id, name: o.name, type: o.type }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}
