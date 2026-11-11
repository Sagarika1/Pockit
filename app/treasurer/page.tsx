"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuditGrid from "./AuditGrid";

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

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="py-6 sm:px-6 sm:first:pl-0">
      <p className="text-sm text-zinc-500 mb-1">{label}</p>
      <p className={`text-3xl font-medium tracking-tight tabular-nums ${highlight ? "text-[#F2C46D]" : ""}`}>{value}</p>
    </div>
  );
}

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
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <header className="flex items-baseline justify-between mb-12">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Pockit</h1>
          <span className="text-zinc-500">Treasurer</span>
        </div>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
          Submit a receipt
        </Link>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 border-y divide-y sm:divide-y-0 sm:divide-x mb-14">
        <Stat label="Reimbursed" value={`$${paidTotal.toFixed(2)}`} />
        <Stat label="Handled by rules" value={`${autoHandled} of ${claims.length}`} />
        <Stat label="Waiting on you" value={String(pending.length)} highlight={pending.length > 0} />
      </section>

      <section className="mb-14">
        <h2 className="text-lg font-medium mb-4">Needs your review</h2>
        {pending.length === 0 ? (
          <p className="text-zinc-500">Nothing to review. Claims that break a rule will appear here.</p>
        ) : (
          <ul className="border-y divide-y">
            {pending.map((c) => (
              <li key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <p>
                    <span className="font-medium">{c.memberName}</span>{" "}
                    <span className="text-zinc-400">at {c.receipt.vendor}</span>
                  </p>
                  <p className="text-sm text-[#F2C46D]/80 mt-1">{c.rule}</p>
                </div>
                <p className="text-lg font-medium tabular-nums">${c.receipt.total.toFixed(2)}</p>
                <div className="flex gap-2">
                  <button
                    disabled={busy === c.id}
                    onClick={() => act(c.id, "approve")}
                    className="rounded-full bg-[#8B9CFF] px-4 py-2 text-sm font-medium text-black hover:bg-[#A3B1FF] transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B9CFF]"
                  >
                    {busy === c.id ? "Paying…" : "Approve and pay"}
                  </button>
                  <button
                    disabled={busy === c.id}
                    onClick={() => act(c.id, "deny")}
                    className="rounded-full border px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B9CFF]"
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AuditGrid claims={claims} />
    </main>
  );
}