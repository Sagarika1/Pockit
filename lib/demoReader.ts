// Demo mode: when there is no ANTHROPIC_API_KEY, Pockit reads the sample receipts from a saved
// answer instead of calling the AI. Everything after that (rules, approvals, texts, PayPal
// sandbox payouts) runs for real. With a key set, this file is never used.
import type { ParsedReceipt } from "./receipt";

const base = { currency: "USD", needs_review: false, review_reason: null, contains_alcohol: false };

// Matched by file name, so the files in /sample-receipts work as long as you keep their names.
const SAMPLES: { match: string; receipt: ParsedReceipt }[] = [
  { match: "meals-under-cap", receipt: { ...base, vendor: "Joe's Taco Shop", date: "2026-11-06", total: 25.59, category: "meals", line_items: [{ description: "Chicken Burrito", amount: 11.5 }, { description: "Chips & Guac", amount: 6.25 }, { description: "Fountain Drink", amount: 2.99 }] } },
  { match: "meals-with-beer", receipt: { ...base, vendor: "The Copper Tap", date: "2026-11-06", total: 43.57, category: "meals", contains_alcohol: true, line_items: [{ description: "Cheeseburger", amount: 14 }, { description: "Fries", amount: 5.5 }, { description: "IPA Draft Beer", amount: 7.5 }, { description: "IPA Draft Beer", amount: 7.5 }] } },
  { match: "meals-over-cap", receipt: { ...base, vendor: "Harbor Grill & Bistro", date: "2026-11-07", total: 109.02, category: "meals", line_items: [{ description: "Grilled Salmon", amount: 28 }, { description: "Ribeye Steak", amount: 36 }, { description: "Caesar Salad", amount: 11 }, { description: "Cheesecake", amount: 9.5 }] } },
  { match: "rideshare", receipt: { ...base, vendor: "RideWay", date: "2026-11-05", total: 27.85, category: "rideshare", line_items: [{ description: "Base fare", amount: 3.5 }, { description: "Distance (11.2 mi)", amount: 14.2 }, { description: "Time (22 min)", amount: 4.4 }, { description: "Booking fee", amount: 2.75 }] } },
  { match: "hotel", receipt: { ...base, vendor: "Staywell Inn & Suites", date: "2026-11-08", total: 525.48, category: "hotel", line_items: [{ description: "Room rate (3 nights)", amount: 417 }, { description: "Parking (3 nights)", amount: 36 }] } },
  { match: "flight", receipt: { ...base, vendor: "Skyline Airways", date: "2026-11-05", total: 284.3, category: "flight", line_items: [{ description: "Base fare", amount: 214 }, { description: "Carrier surcharge", amount: 28 }, { description: "Taxes & airport fees", amount: 42.3 }] } },
  { match: "other-supplies", receipt: { ...base, vendor: "Paper & Pen Supply", date: "2026-11-06", total: 28.8, category: "other", line_items: [{ description: "Poster board x4", amount: 11.96 }, { description: "Markers (12 pk)", amount: 8.49 }, { description: "Printing - 20 pages", amount: 6 }] } },
  { match: "registration", receipt: { ...base, vendor: "National Student Engineering Conference (NSEC) 2026", date: "2026-11-05", total: 155, category: "registration", line_items: [{ description: "Student Registration", amount: 120 }, { description: "Workshop Pass", amount: 35 }] } },
];

export const isDemoReader = () => !process.env.ANTHROPIC_API_KEY;

export const DEMO_RECEIPT_MESSAGE =
  "Demo mode can read the 8 receipts in the sample-receipts folder. To read any photo, add an ANTHROPIC_API_KEY (see the README).";

export function demoReceipt(fileName: string): ParsedReceipt | null {
  const n = fileName.toLowerCase();
  const hit = SAMPLES.find((s) => n.includes(s.match));
  return hit ? structuredClone(hit.receipt) : null;
}

// A saved example for the rules upload in demo mode
export const DEMO_RULES_SUGGESTION = {
  eventName: "Spring Gala",
  eventStart: "2026-04-10",
  eventEnd: "2026-04-12",
  requireEventDates: true,
  blockAlcohol: true,
  autoPayCeiling: 150,
  registrationVendorKeywords: [],
  categories: {
    meals: { action: "auto", cap: 30 },
    rideshare: { action: "auto", cap: 25 },
    registration: { action: "review", cap: null },
    hotel: { action: "deny", cap: null },
    flight: { action: "review", cap: null },
    other: { action: "review", cap: null },
  },
  summary: "Demo mode: this is an example, not read from your file. Add an Anthropic key to read your own policy.",
  assumptions: ["Add ANTHROPIC_API_KEY to read real policy documents."],
};
