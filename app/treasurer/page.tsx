"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Claim = {
  id: string;
  memberName: string;
  receipt: { vendor: string; total: number; category: string; date: string | null };
  rule: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  payoutBatchId?: string;
};

const BADGE: Record<string, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending_review: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  denied: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  payout_failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function TreasurerPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/claims", { cache: "no-store" });
    setClaims(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "deny") {
    setBusy(id);
    await fetch(`/api/claims/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
    setBusy(null);
  }

  const pending = claims.filter((c) => c.status === "pending_review");
  const paidTotal = claims.filter((c) => c.status === "paid").reduce((s, c) => s + c.receipt.total, 0);
  const autoHandled = claims.filter((c) => !c.reviewedAt && c.status !== "pending_review").length;

  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Pockit · Treasurer</h1>
        <Link href="/" className="text-sm underline opacity-70">Submit a receipt</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="border rounded-xl p-4"><p className="text-sm opacity-60">Reimbursed</p><p className="text-2xl font-bold">${paidTotal.toFixed(2)}</p></div>
        <div className="border rounded-xl p-4"><p className="text-sm opacity-60">Handled automatically</p><p className="text-2xl font-bold">{autoHandled} of {claims.length}</p></div>
        <div className="border rounded-xl p-4"><p className="text-sm opacity-60">Needs your review</p><p className="text-2xl font-bold">{pending.length}</p></div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Needs your review</h2>
      {pending.length === 0 && <p className="opacity-60 mb-10">You're all caught up.</p>}
      <div className="space-y-3 mb-10">
        {pending.map((c) => (
          <div key={c.id} className="border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold">{c.memberName} · ${c.receipt.total.toFixed(2)} at {c.receipt.vendor}</p>
              <p className="text-sm opacity-70">Flagged: {c.rule}</p>
            </div>
            <div className="flex gap-2">
              <button disabled={busy === c.id} onClick={() => act(c.id, "approve")} className="bg-green-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">Approve & pay</button>
              <button disabled={busy === c.id} onClick={() => act(c.id, "deny")} className="border rounded-lg px-4 py-2 disabled:opacity-50">Deny</button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Audit log</h2>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left opacity-60">
            <tr><th className="p-3">Member</th><th className="p-3">Vendor</th><th className="p-3">Amount</th><th className="p-3">Category</th><th className="p-3">Rule applied</th><th className="p-3">Status</th><th className="p-3">Submitted</th></tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.memberName}</td>
                <td className="p-3">{c.receipt.vendor}</td>
                <td className="p-3">${c.receipt.total.toFixed(2)}</td>
                <td className="p-3 capitalize">{c.receipt.category}</td>
                <td className="p-3">{c.rule}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${BADGE[c.status] ?? ""}`}>{c.status.replace("_", " ")}</span></td>
                <td className="p-3 whitespace-nowrap">{new Date(c.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}