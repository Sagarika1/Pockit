// Pure module (no Node imports) so both the server and the Rules page can use it.

export const CATEGORY_KEYS = ["meals", "rideshare", "registration", "hotel", "flight", "other"] as const;
export type Category = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  meals: "Meals",
  rideshare: "Rides",
  registration: "Registration fees",
  hotel: "Hotels",
  flight: "Flights",
  other: "Everything else",
};

// Singular wording for sentences ("Hotel needs treasurer approval")
const NOUN: Record<Category, string> = {
  meals: "Meal",
  rideshare: "Ride",
  registration: "Registration",
  hotel: "Hotel",
  flight: "Flight",
  other: "Other expense",
};

export type CategoryAction = "auto" | "review" | "deny";
export type CategoryRule = { action: CategoryAction; cap: number | null };

export type Rules = {
  eventName: string;
  eventStart: string; // YYYY-MM-DD
  eventEnd: string; // YYYY-MM-DD
  requireEventDates: boolean;
  blockAlcohol: boolean;
  partialPay: boolean; // over a limit? pay up to the limit instead of sending it to the treasurer
  autoPayCeiling: number; // never pay automatically above this, whatever the category
  registrationVendorKeywords: string[]; // registration vendor must contain one (empty = no check)
  categories: Record<Category, CategoryRule>;
};

export const DEFAULT_RULES: Rules = {
  eventName: "National Student Engineering Conference",
  eventStart: "2026-11-05",
  eventEnd: "2026-11-08",
  requireEventDates: true,
  blockAlcohol: true,
  partialPay: true,
  autoPayCeiling: 200,
  registrationVendorKeywords: ["engineering conference", "nsec"],
  categories: {
    meals: { action: "auto", cap: 50 },
    rideshare: { action: "auto", cap: 40 },
    registration: { action: "auto", cap: null },
    hotel: { action: "review", cap: null },
    flight: { action: "review", cap: null },
    other: { action: "review", cap: null },
  },
};

export function defaultRules(): Rules {
  return JSON.parse(JSON.stringify(DEFAULT_RULES)) as Rules;
}

// ---------- Cleaning up anything that comes from a form or from the AI ----------
function str(v: unknown, fallback: string, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : fallback;
}
function bool(v: unknown, fallback: boolean) {
  return typeof v === "boolean" ? v : fallback;
}
function money(v: unknown, fallback: number) {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? Math.round(n * 100) / 100 : fallback;
}
function date(v: unknown, fallback: string) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return fallback;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? fallback : v;
}
function keywords(v: unknown, fallback: string[]) {
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : null;
  if (!list) return fallback;
  return list
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().toLowerCase().slice(0, 60))
    .filter(Boolean)
    .slice(0, 20);
}

export function sanitizeRules(input: unknown, base: Rules = DEFAULT_RULES): Rules {
  const i = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const cats = (i.categories && typeof i.categories === "object" ? i.categories : {}) as Record<string, unknown>;

  const categories = {} as Record<Category, CategoryRule>;
  for (const key of CATEGORY_KEYS) {
    const c = (cats[key] && typeof cats[key] === "object" ? cats[key] : {}) as Record<string, unknown>;
    const action: CategoryAction = c.action === "auto" || c.action === "review" || c.action === "deny" ? c.action : base.categories[key].action;
    let cap: number | null = base.categories[key].cap;
    if ("cap" in c) cap = c.cap === null || c.cap === "" || c.cap === undefined ? null : money(c.cap, cap ?? 0);
    categories[key] = { action, cap: action === "auto" ? cap : null };
  }

  let eventStart = date(i.eventStart, base.eventStart);
  let eventEnd = date(i.eventEnd, base.eventEnd);
  if (eventEnd < eventStart) [eventStart, eventEnd] = [eventEnd, eventStart];

  return {
    eventName: str(i.eventName, base.eventName, 120),
    eventStart,
    eventEnd,
    requireEventDates: bool(i.requireEventDates, base.requireEventDates),
    blockAlcohol: bool(i.blockAlcohol, base.blockAlcohol),
    partialPay: bool(i.partialPay, base.partialPay),
    autoPayCeiling: money(i.autoPayCeiling, base.autoPayCeiling),
    registrationVendorKeywords: keywords(i.registrationVendorKeywords, base.registrationVendorKeywords),
    categories,
  };
}

// ---------- Plain-language wording ----------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function shortDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return m >= 1 && m <= 12 ? `${MONTHS[m - 1]} ${d}` : iso;
}
export function usd(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
export function noun(c: Category) {
  return NOUN[c];
}

/** The rules, as short sentences a member can read. */
export function describeRules(r: Rules): string[] {
  const lines: string[] = [];
  for (const key of CATEGORY_KEYS) {
    const c = r.categories[key];
    const label = CATEGORY_LABEL[key];
    if (c.action === "auto") lines.push(c.cap === null ? `${label}: paid automatically` : `${label}: paid automatically up to ${usd(c.cap)}`);
    else if (c.action === "review") lines.push(`${label}: your treasurer approves each one`);
    else lines.push(`${label}: not reimbursed`);
  }
  const anyCap = CATEGORY_KEYS.some((k) => r.categories[k].action === "auto" && r.categories[k].cap !== null);
  if (anyCap) lines.push(r.partialPay !== false ? "Spent more than a limit? You're paid back up to the limit" : "Spent more than a limit? Your treasurer decides");
  if (r.requireEventDates)
    lines.push(`Receipts must be dated ${shortDate(r.eventStart)} to ${shortDate(r.eventEnd)}${r.eventName ? ` (${r.eventName})` : ""}`);
  if (r.blockAlcohol) lines.push("Alcohol is never reimbursed");
  lines.push(`Anything over ${usd(r.autoPayCeiling)} goes to your treasurer first`);
  return lines;
}
