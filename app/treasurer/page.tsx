"use client";
import { useCallback, useEffect, useState } from "react";
import AuditGrid from "./AuditGrid";
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
    <div className="rounded-2xl border border-line bg-card px-6 py-5">
      <p className="mb-1 text-sm text-muted">{label}</p>
      <p className={`text-4xl font-bold tracking-tight tabular-nums ${accent ? "text-brand" : warn ? "text-wa-tx" : "text-ink"}`}>
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
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Treasurer dashboard</h1>
        <p className="mt-2 text-lg text-muted">Review flagged claims and keep an eye on every payout.</p>
      </div>

      <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Reimbursed" value={`$${paidTotal.toFixed(2)}`} accent />
        <Stat label="Handled by rules" value={`${autoHandled} of ${claims.length}`} />
        <Stat label="Waiting on you" value={String(pending.length)} warn={pending.length > 0} />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Needs your review</h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card p-6 text-muted">
            Nothing to review. Claims that break a rule will appear here.
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="font-semibold">{c.memberName}</span>{" "}
                    <span className="text-muted">at {c.receipt.vendor}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusChip status="pending_review" />
                    <span className="text-sm text-muted">{c.rule}</span>
                  </div>
                </div>
                <p className="text-2xl font-bold tabular-nums">${c.receipt.total.toFixed(2)}</p>
                <div className="flex gap-2">
                  <button
                    disabled={busy === c.id}
                    onClick={() => act(c.id, "approve")}
                    className="h-11 rounded-full bg-brand px-6 text-sm font-semibold text-on-brand transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {busy === c.id ? "Paying…" : "Approve and pay"}
                  </button>
                  <button
                    disabled={busy === c.id}
                    onClick={() => act(c.id, "deny")}
                    className="h-11 rounded-full border border-line px-6 text-sm font-semibold text-ink transition-colors hover:bg-soft disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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