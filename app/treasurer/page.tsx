"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuditGrid from "./AuditGrid";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import StatusChip from "@/components/StatusChip";

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

function Stat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="bg-card border border-line rounded-2xl px-5 py-4">
      <p className="text-sm text-muted mb-1">{label}</p>
      <p className={`text-3xl font-bold tracking-tight tabular-nums ${accent ? "text-brand" : warn ? "text-wa-tx" : "text-ink"}`}>
        {value}
      </p>
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
    <main className="min-h-screen bg-page text-ink">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-muted hidden sm:inline">Treasurer</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-brand hover:underline">
              Submit a receipt
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Stat label="Reimbursed" value={`$${paidTotal.toFixed(2)}`} accent />
          <Stat label="Handled by rules" value={`${autoHandled} of ${claims.length}`} />
          <Stat label="Waiting on you" value={String(pending.length)} warn={pending.length > 0} />
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Needs your review</h2>
          {pending.length === 0 ? (
            <p className="text-muted">Nothing to review. Claims that break a rule will appear here.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((c) => (
                <li
                  key={c.id}
                  className="bg-card border border-line rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p>
                      <span className="font-semibold">{c.memberName}</span>{" "}
                      <span className="text-muted">at {c.receipt.vendor}</span>
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusChip status="pending_review" />
                      <span className="text-sm text-muted">{c.rule}</span>
                    </div>
                  </div>
                  <p className="text-xl font-bold tabular-nums">${c.receipt.total.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <button
                      disabled={busy === c.id}
                      onClick={() => act(c.id, "approve")}
                      className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand hover:opacity-90 transition-opacity disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {busy === c.id ? "Paying…" : "Approve and pay"}
                    </button>
                    <button
                      disabled={busy === c.id}
                      onClick={() => act(c.id, "deny")}
                      className="h-11 rounded-xl border border-line px-5 text-sm font-semibold text-ink hover:bg-soft transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
      </div>
    </main>
  );
}