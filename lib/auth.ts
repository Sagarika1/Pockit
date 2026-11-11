import { cookies } from "next/headers";
import { getOrg, getUser, type Org, type User } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

export async function getSession(): Promise<{ user: User; org?: Org } | null> {
  const jar = await cookies();
  const uid = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const user = await getUser(uid);
  if (!user) return null;
  const org = user.orgId ? await getOrg(user.orgId) : undefined;
  return { user, org };
}

export async function startSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

type Denied = { ok: false; response: Response };

/** Use at the top of a treasurer-only route. */
export async function requireTreasurer(): Promise<{ ok: true; user: User; org: Org } | Denied> {
  const s = await getSession();
  if (!s) return { ok: false, response: Response.json({ error: "Please log in." }, { status: 401 }) };
  if (s.user.role !== "treasurer" || !s.org)
    return { ok: false, response: Response.json({ error: "Only the organization account can do that." }, { status: 403 }) };
  return { ok: true, user: s.user, org: s.org };
}

/** Use at the top of a member-only route. */
export async function requireMember(): Promise<{ ok: true; user: User } | Denied> {
  const s = await getSession();
  if (!s) return { ok: false, response: Response.json({ error: "Please log in." }, { status: 401 }) };
  if (s.user.role !== "member")
    return { ok: false, response: Response.json({ error: "Only members can do that." }, { status: 403 }) };
  return { ok: true, user: s.user };
}
