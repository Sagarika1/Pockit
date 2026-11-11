import { evaluate, Receipt } from "@/lib/policy";

const samples: Receipt[] = [
  { vendor: "Airport Grill", date: "2026-11-12", total: 18, currency: "USD", category: "meals", contains_alcohol: false, line_items: [] },
  { vendor: "Uber", date: "2026-11-13", total: 32, currency: "USD", category: "rideshare", contains_alcohol: false, line_items: [] },
  { vendor: "Downtown Hotel", date: "2026-11-15", total: 389, currency: "USD", category: "hotel", contains_alcohol: false, line_items: [] },
  { vendor: "Steakhouse", date: "2026-11-13", total: 45, currency: "USD", category: "meals", contains_alcohol: true, line_items: [] },
  { vendor: "Pizza Place", date: "2026-11-01", total: 22, currency: "USD", category: "meals", contains_alcohol: false, line_items: [] },
];

export async function GET() {
  return Response.json(samples.map((r) => ({ vendor: r.vendor, ...evaluate(r) })));
}