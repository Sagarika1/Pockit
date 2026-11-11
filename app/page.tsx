"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

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
    <main className="min-h-screen bg-page text-ink">
      <div className="max-w-lg mx-auto p-6 sm:p-10">
        <div className="flex items-center justify-between mb-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href="/treasurer" className="text-sm font-medium text-brand hover:underline">
              Treasurer view
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <p className="mb-6 text-base leading-relaxed text-muted">
          Snap your trip receipt. Get reimbursed in minutes, not weeks.
        </p>

        <div className="bg-card border border-line rounded-2xl p-5 space-y-4 mb-6">
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
          <label className="flex flex-col items-center gap-2.5 border-2 border-dashed border-brand bg-soft rounded-2xl px-5 py-10 text-center cursor-pointer hover:opacity-90 focus-within:ring-2 focus-within:ring-brand">
            <span className="w-14 h-14 rounded-full bg-brand flex items-center justify-center">
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

        {step === "reading" && <p className="text-center p-10 text-muted">Reading your receipt…</p>}

        {(step === "confirm" || step === "submitting") && receipt && (
          <div className="bg-card border border-line rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Does this look right?</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm mb-6">
              <dt className="text-muted">Vendor</dt><dd>{receipt.vendor}</dd>
              <dt className="text-muted">Date</dt><dd>{receipt.date ?? "Unreadable"}</dd>
              <dt className="text-muted">Total</dt><dd>${receipt.total.toFixed(2)}</dd>
              <dt className="text-muted">Category</dt><dd className="capitalize">{receipt.category}</dd>
            </dl>
            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={step === "submitting"}
                className="flex-1 h-11 bg-brand text-on-brand rounded-xl font-semibold disabled:opacity-50"
              >
                {step === "submitting" ? "Submitting…" : "Submit for reimbursement"}
              </button>
              <button onClick={reset} className="h-11 px-4 border border-line rounded-xl font-semibold">
                Retake
              </button>
            </div>
          </div>
        )}

        {step === "done" && claim && (
          <div className={`border rounded-2xl p-6 ${STATUS[claim.status]?.style ?? "bg-card border-line"}`}>
            <h2 className="text-xl font-semibold mb-1">{STATUS[claim.status]?.title ?? claim.status}</h2>
            <p className="text-2xl font-bold mb-2">
              ${claim.receipt.total.toFixed(2)} · {claim.receipt.vendor}
            </p>
            <p className="text-sm mb-4">Why: {claim.rule}</p>
            <button onClick={reset} className="h-11 px-4 border border-current rounded-xl font-semibold">
              Submit another receipt
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-no-tx">{error}</p>}

        <p className="mt-6 text-[13px] text-muted">
          Paid via PayPal · every claim is logged for audit
        </p>
      </div>
    </main>
  );
}