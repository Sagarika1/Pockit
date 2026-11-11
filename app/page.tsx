"use client";
import { useState } from "react";

type Receipt = {
  vendor: string;
  date: string | null;
  total: number;
  currency: string;
  category: string;
  contains_alcohol: boolean;
  line_items: { description: string; amount: number }[];
  needs_review?: boolean;
  review_reason?: string | null;
};
type Claim = { status: string; rule: string; receipt: Receipt };

const STATUS: Record<string, { title: string; style: string }> = {
  paid: { title: "Paid to your PayPal", style: "bg-ok-bg text-ok-tx border-ok-tx/30" },
  pending_review: { title: "Sent to your treasurer for review", style: "bg-wa-bg text-wa-tx border-wa-tx/30" },
  rejected: { title: "Not reimbursable", style: "bg-no-bg text-no-tx border-no-tx/30" },
  payout_failed: { title: "Approved, but the payout failed", style: "bg-no-bg text-no-tx border-no-tx/30" },
};

const inputClass =
  "w-full h-12 rounded-xl border border-line bg-page px-3.5 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand";

const BENEFITS = [
  "Paid out through PayPal when your claim passes",
  "Checked against your club's budget rules",
  "Every decision logged for audit",
];

const STEPS = [
  { n: "1", title: "Snap the receipt", body: "Upload a photo. Our AI reads the vendor, date, total and category." },
  { n: "2", title: "Rules check it", body: "Plain code, not guesswork, checks the category, spending caps and trip dates." },
  { n: "3", title: "Get paid or reviewed", body: "Passing claims are paid through PayPal. Anything else goes to your treasurer." },
];

export default function SubmitPage() {
  const [name, setName] = useState("Maya");
  const [email, setEmail] = useState("sb-5svzx53843471@personal.example.com");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [step, setStep] = useState<"upload" | "reading" | "confirm" | "submitting" | "done">("upload");
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep("reading");
    setError("");
    const form = new FormData();
    form.append("receipt", file);
    try {
      const res = await fetch("/api/parse-receipt", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Could not read receipt");
      setReceipt(data);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("upload");
    }
  }

  async function submit() {
    setStep("submitting");
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberName: name, memberEmail: email, receipt }),
    });
    setClaim(await res.json());
    setStep("done");
  }

  function reset() {
    setReceipt(null);
    setClaim(null);
    setStep("upload");
  }

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-line bg-soft">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20">
          <div>
            <p className="mb-3 text-sm font-semibold text-brand">Club reimbursements</p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Get reimbursed in minutes, not weeks.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Snap your trip receipt and Pockit does the rest. No more fronting cash and waiting for your club to pay you back.
            </p>
            <ul className="mt-8 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3 text-[15px]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round" className="text-on-brand" aria-hidden="true">
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
            <h2 className="mb-5 text-xl font-semibold">Submit a receipt</h2>

            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[13px] font-medium text-muted">Your name</label>
                <input id="name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[13px] font-medium text-muted">Your PayPal email</label>
                <input id="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your PayPal email" />
              </div>
            </div>

            {step === "upload" && (
              <label className="flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-brand bg-soft px-5 py-10 text-center hover:opacity-90 focus-within:ring-2 focus-within:ring-brand">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" className="text-on-brand" aria-hidden="true">
                    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                </span>
                <span className="text-lg font-semibold">Upload a receipt photo</span>
                <span className="text-sm text-muted">JPG, PNG or WebP · or use your camera</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="sr-only" />
              </label>
            )}

            {step === "reading" && <p className="p-10 text-center text-muted">Reading your receipt…</p>}

            {(step === "confirm" || step === "submitting") && receipt && (
              <div className="rounded-2xl border border-line bg-page p-6">
                <h3 className="mb-4 font-semibold">Does this look right?</h3>
                <dl className="mb-6 grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted">Vendor</dt><dd>{receipt.vendor}</dd>
                  <dt className="text-muted">Date</dt><dd>{receipt.date ?? "Unreadable"}</dd>
                  <dt className="text-muted">Total</dt><dd>${receipt.total.toFixed(2)}</dd>
                  <dt className="text-muted">Category</dt><dd className="capitalize">{receipt.category}</dd>
                </dl>
                <div className="flex gap-3">
                  <button
                    onClick={submit}
                    disabled={step === "submitting"}
                    className="h-12 flex-1 rounded-full bg-brand font-semibold text-on-brand hover:opacity-90 disabled:opacity-50"
                  >
                    {step === "submitting" ? "Submitting…" : "Submit for reimbursement"}
                  </button>
                  <button onClick={reset} className="h-12 rounded-full border border-line px-5 font-semibold hover:bg-soft">
                    Retake
                  </button>
                </div>
              </div>
            )}

            {step === "done" && claim && (
              <div className={`rounded-2xl border p-6 ${STATUS[claim.status]?.style ?? "bg-card border-line"}`}>
                <h3 className="mb-1 text-xl font-semibold">{STATUS[claim.status]?.title ?? claim.status}</h3>
                <p className="mb-2 text-2xl font-bold">
                  ${claim.receipt.total.toFixed(2)} · {claim.receipt.vendor}
                </p>
                <p className="mb-4 text-sm">Why: {claim.rule}</p>
                <button onClick={reset} className="h-11 rounded-full border border-current px-5 font-semibold">
                  Submit another receipt
                </button>
              </div>
            )}

            {error && <p className="mt-4 text-no-tx">{error}</p>}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-card p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-on-brand">
                {s.n}
              </span>
              <h3 className="mb-1.5 text-lg font-semibold">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}