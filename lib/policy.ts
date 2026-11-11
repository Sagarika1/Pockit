export type Receipt = {
  vendor: string;
  date: string | null;
  total: number;
  currency: string;
  category: "meals" | "rideshare" | "registration" | "hotel" | "flight" | "other";
  contains_alcohol: boolean;
  line_items: { description: string; amount: number }[];
};

export type Decision = {
  decision: "auto_approve" | "needs_review" | "reject";
  rule: string;
};

export const TRIP = {
  name: "National Student Engineering Conference",
  start: "2026-11-12",
  end: "2026-11-15",
  conferenceKeywords: ["engineering conference", "nsec"],
  mealCap: 50,
  rideCap: 40,
};

export function evaluate(r: Receipt): Decision {
  const onTrip = r.date !== null && r.date >= TRIP.start && r.date <= TRIP.end;

  if (r.contains_alcohol)
    return { decision: "reject", rule: "Alcohol isn't reimbursable" };

  if (r.category === "hotel" || r.category === "flight")
    return { decision: "needs_review", rule: "Hotels and flights always need treasurer review" };

  if (r.category === "registration") {
    const v = r.vendor.toLowerCase();
    return TRIP.conferenceKeywords.some((k) => v.includes(k))
      ? { decision: "auto_approve", rule: "Registration matches the approved conference" }
      : { decision: "needs_review", rule: "Registration vendor doesn't match the conference" };
  }

  if (r.category === "meals" || r.category === "rideshare") {
    if (!onTrip)
      return { decision: "needs_review", rule: "Receipt date is outside the trip dates" };
    const cap = r.category === "meals" ? TRIP.mealCap : TRIP.rideCap;
    return r.total <= cap
      ? { decision: "auto_approve", rule: `${r.category} under $${cap} during the trip` }
      : { decision: "needs_review", rule: `${r.category} over the $${cap} cap` };
  }

  return { decision: "needs_review", rule: "Uncategorized expense" };
}