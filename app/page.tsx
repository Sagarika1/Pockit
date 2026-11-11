"use client";
import { useState } from "react";
import Link from "next/link";

type Receipt = {
  vendor: string;
  date: string | null;
  total: number;
  currency: string;
  category: string;
  contains_alcohol: boolean;
  line_items: { description: string; amount: number }[];
};
type Claim = { status: string; rule: string; receipt: Receipt };

const STATUS: Record<string, { title: string; style: string }> = {
  paid: { title: "Paid to your PayPal", style: "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800" },
  pending_review: { title: "Sent to your treasurer for review", style: "bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-800" },
  rejected: { title: "Not reimbursable", style: "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800" },
  payout_failed: { title: "Approved, but the payout failed", style: "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800" },
};

async function shrinkImage(file: File, maxSide = 1600): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b!), "image/jpeg", 0.85)
  );
  return new File([blob], "receipt.jpg", { type: "image/jpeg" });
}

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
    form.append("receipt", await shrinkImage(file));
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
    <main className="max-w-lg mx-auto p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Pockit</h1>
        <Link href="/treasurer" className="text-sm underline opacity-70">Treasurer view</Link>
      </div>
      <p className="mb-6 opacity-80">Snap your trip receipt. Get reimbursed in minutes, not weeks.</p>

      <div className="space-y-3 mb-6">
        <input className="w-full border rounded-lg p-3 bg-transparent" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <input className="w-full border rounded-lg p-3 bg-transparent" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your PayPal email" />
      </div>

      {step === "upload" && (
        <label className="block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:opacity-80">
          <span className="text-lg font-medium">Upload a receipt photo</span>
          <span className="block text-sm opacity-60 mt-1">JPG or PNG</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
        </label>
      )}

      {step === "reading" && <p className="text-center p-10">Reading your receipt…</p>}

      {(step === "confirm" || step === "submitting") && receipt && (
        <div className="border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Does this look right?</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm mb-6">
            <dt className="opacity-60">Vendor</dt><dd>{receipt.vendor}</dd>
            <dt className="opacity-60">Date</dt><dd>{receipt.date ?? "Unreadable"}</dd>
            <dt className="opacity-60">Total</dt><dd>${receipt.total.toFixed(2)}</dd>
            <dt className="opacity-60">Category</dt><dd className="capitalize">{receipt.category}</dd>
          </dl>
          <div className="flex gap-3">
            <button onClick={submit} disabled={step === "submitting"} className="flex-1 bg-blue-600 text-white rounded-lg p-3 font-medium disabled:opacity-50">
              {step === "submitting" ? "Submitting…" : "Submit for reimbursement"}
            </button>
            <button onClick={reset} className="border rounded-lg p-3">Retake</button>
          </div>
        </div>
      )}

      {step === "done" && claim && (
        <div className={`border rounded-xl p-6 ${STATUS[claim.status]?.style ?? ""}`}>
          <h2 className="text-xl font-semibold mb-1">{STATUS[claim.status]?.title ?? claim.status}</h2>
          <p className="text-2xl font-bold mb-2">${claim.receipt.total.toFixed(2)} · {claim.receipt.vendor}</p>
          <p className="text-sm opacity-80 mb-4">Why: {claim.rule}</p>
          <button onClick={reset} className="border rounded-lg px-4 py-2">Submit another receipt</button>
        </div>
      )}

      {error && <p className="mt-4 text-red-600">{error}</p>}
    </main>
  );
}