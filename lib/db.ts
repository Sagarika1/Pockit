import { promises as fs } from "fs";
import path from "path";
import type { Rules } from "./rules";

// ---------- Types ----------
export type OrgType = "school_club" | "nonprofit" | "volunteer";
export type Org = {
  id: string;
  name: string;
  type: OrgType;
  paypalBusinessEmail?: string;
  rules: Rules;
  createdAt: string;
};

export type UserRole = "treasurer" | "member";
export type User = {
  id: string;
  role: UserRole;
  name: string;
  email: string; // always lowercase
  phone?: string;
  paypalEmail?: string; // where a member's payments are sent
  orgId?: string; // set for treasurers
  passwordHash: string;
  createdAt: string;
};

export type MemberKind = "student" | "employee" | "volunteer";
export type MembershipStatus = "pending" | "approved" | "denied" | "removed";
export type Membership = {
  id: string;
  orgId: string;
  userId: string;
  kind: MemberKind;
  status: MembershipStatus;
  addedBy: "self" | "treasurer";
  createdAt: string;
  decidedAt?: string;
};

export type SmsLog = {
  id: string;
  to: string;
  body: string;
  status: "sent" | "demo" | "failed" | "skipped";
  error?: string;
  orgId?: string;
  createdAt: string;
};

// ---------- JSON file tables (data/*.json, gitignored) ----------
function file(table: string) {
  return path.join(process.cwd(), "data", `${table}.json`);
}

// One write at a time, so two requests can't overwrite each other.
let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn);
  chain = run.catch(() => undefined);
  return run;
}

export async function read<T>(table: string): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(file(table), "utf8")) as T[];
  } catch {
    return [];
  }
}

/** Read the table, let `fn` change the rows in place, then save. Safe against concurrent requests. */
export function update<T, R = void>(table: string, fn: (rows: T[]) => R): Promise<R> {
  return withLock(async () => {
    const rows = await read<T>(table);
    const out = fn(rows);
    await fs.mkdir(path.dirname(file(table)), { recursive: true });
    await fs.writeFile(file(table), JSON.stringify(rows, null, 2));
    return out;
  });
}

// ---------- Small lookups ----------
export async function findUserByEmail(email: string) {
  const e = email.trim().toLowerCase();
  return (await read<User>("users")).find((u) => u.email === e);
}
export async function getUser(id: string) {
  return (await read<User>("users")).find((u) => u.id === id);
}
export async function getOrg(id: string) {
  return (await read<Org>("orgs")).find((o) => o.id === id);
}
export async function getTreasurer(orgId: string) {
  return (await read<User>("users")).find((u) => u.role === "treasurer" && u.orgId === orgId);
}

export function publicUser(u: User) {
  return { id: u.id, role: u.role, name: u.name, email: u.email, phone: u.phone, paypalEmail: u.paypalEmail };
}

export function isEmail(s: unknown): s is string {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim()) && s.length <= 254;
}
