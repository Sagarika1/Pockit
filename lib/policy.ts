import { CATEGORY_LABEL, DEFAULT_RULES, noun, shortDate, usd, type Rules } from "./rules";

export type Receipt = {
  vendor: string;
  date: string | null;
  total: number;
  currency: string;
  category: "meals" | "rideshare" | "registration" | "hotel" | "flight" | "other";
  contains_alcohol: boolean;
  line_items: { description: string; amount: number }[];
  needs_review?: boolean;
  review_reason?: string | null;
};

export type Decision = {
  decision: "auto_approve" | "needs_review" | "reject";
  rule: string;
};

const cents = (n: number) => Math.round(n * 100);

/**
 * The money decision. The AI only reads the receipt; this plain code decides.
 * `rules` come from the organization (Rules page). The default keeps old callers working.
 */
export function evaluate(r: Receipt, rules: Rules = DEFAULT_RULES): Decision {
  if (r.contains_alcohol && rules.blockAlcohol) return { decision: "reject", rule: "Alcohol can't be reimbursed" };

  if (r.needs_review)
    return { decision: "needs_review", rule: r.review_reason ?? "We couldn't read this receipt clearly" };

  const c = rules.categories[r.category];
  const label = CATEGORY_LABEL[r.category].toLowerCase();

  if (c.action === "deny") return { decision: "reject", rule: `${CATEGORY_LABEL[r.category]} aren't reimbursed by this organization` };
  if (c.action === "review") return { decision: "needs_review", rule: `${noun(r.category)} needs treasurer approval` };

  // action === "auto" from here on
  if (r.category === "registration" && rules.registrationVendorKeywords.length > 0) {
    const v = r.vendor.toLowerCase();
    if (!rules.registrationVendorKeywords.some((k) => v.includes(k)))
      return { decision: "needs_review", rule: "Registration isn't from the approved event" };
  }

  const checkDates = rules.requireEventDates && r.category !== "registration";
  if (checkDates) {
    const onEvent = r.date !== null && r.date >= rules.eventStart && r.date <= rules.eventEnd;
    if (!onEvent)
      return { decision: "needs_review", rule: `Dated outside the event (${shortDate(rules.eventStart)} to ${shortDate(rules.eventEnd)})` };
  }

  if (c.cap !== null && cents(r.total) > cents(c.cap))
    return { decision: "needs_review", rule: `Over the ${usd(c.cap)} limit for ${label}` };

  if (cents(r.total) > cents(rules.autoPayCeiling))
    return { decision: "needs_review", rule: `Over the ${usd(rules.autoPayCeiling)} automatic payment limit` };

  const why =
    r.category === "registration"
      ? "Registration matches the approved event"
      : c.cap !== null
        ? `Within the ${usd(c.cap)} limit for ${label}${checkDates ? " and dated during the event" : ""}`
        : `${CATEGORY_LABEL[r.category]} are paid automatically${checkDates ? " during the event" : ""}`;
  return { decision: "auto_approve", rule: why };
}
