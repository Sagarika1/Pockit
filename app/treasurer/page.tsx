"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusChip from "@/components/StatusChip";
import { ErrorText, PageLoading, smallDangerBtn, smallDangerSolidBtn, smallGhostBtn, smallPrimaryBtn } from "@/components/ui";
import { useRequireRole } from "@/components/useMe";
import AuditGrid from "./AuditGrid";

type Claim = {
  id: string;
  memberName: string;
  memberEmail?: string;
  receipt: { vendor: string; total: number; category: string; date: string | null };
  rule: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  payoutBatchId?: string;
  payAmount?: number;
  imageId?: string;
};
type Person = { id: string; status: string };
type Text = { id: string; to: string; body: string; status: string; error?: string; createdAt: string };

function Stat({ label, value, accent, warn, href }: { label: string; value: string; accent?: boolean; warn?: boolean; href?: string }) {
  const body = (
    <>
      <p className="mb-1 text-sm text-muted">{label}</p>
      <p className={`text-4xl font-bold tracking-tight tabular-nums ${accent ? "text-brand" : warn ? "text-accent" : "text-ink"}`}>{value}</p>
    </>
  );
  const cls = "block rounded-2xl border border-line bg-card px-6 py-5";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:border-brand`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const TEXT_STATUS: Record<string, string> = { sent: "Sent", demo: "Demo only (not sent)", failed: "Failed", skipped: "No phone number" };

export default function TreasurerPage() {
  const { me, ready } = useRequireRole("treasurer");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [texts, setTexts] = useState<{ mode: string; messages: Text[] }>({ mode: "demo", messages: [] });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Which request is waiting for "are you sure?", and how much the treasurer will pay
  const [confirming, setConfirming] = useState<{ id: string; action: "approve" | "deny" } | null>(null);
  const [amount, setAmount] = useState("");

  const load = useCallback(async () => {
    const [c, p, t] = await Promise.all([
      fetch("/api/claims", { cache: "no-store" }),
      fetch("/api/people", { cache: "no-store" }),
      fetch("/api/notifications", { cache: "no-store" }),
    ]);
    if (c.ok) setClaims(await c.json());
    if (p.ok) setPeople(await p.json());
    if (t.ok) setTexts(await t.json());
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  function ask(c: Claim, action: "approve" | "deny") {
    setError("");
    setAmount(c.receipt.total.toFixed(2));
    setConfirming({ id: c.id, action });
  }

  async function act(id: string, action: "approve" | "deny") {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/claims/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "approve" ? { action, amount } : { action }),
    });
    if (!res.ok) setError((await res.json()).error || "Something went wrong.");
    else setConfirming(null);
    await load();
    setBusy(null);
  }

  if (!ready) return <PageLoading />;

  const pending = claims.filter((c) => c.status === "pending_review");
  const paidTotal = claims.filter((c) => c.status === "paid").reduce((s, c) => s + (c.payAmount ?? c.receipt.total), 0);
  const automatic = claims.filter((c) => !c.reviewedAt && c.status !== "pending_review").length;
  const waitingPeople = people.filter((p) => p.status === "pending").length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{me?.org?.name ?? "Overview"}</h1>
        <div className="mt-2 h-1 w-9 rounded-full bg-accent" aria-hidden="true" />
        <p className="mt-2 text-lg text-muted">Approve or deny anything that needs a decision, and see every payment in one place.</p>
      </div>

      <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Paid out" value={`$${paidTotal.toFixed(2)}`} accent />
        <Stat label="Decided automatically" value={`${automatic} of ${claims.length}`} />
        <Stat label="Waiting on you" value={String(pending.length)} warn={pending.length > 0} />
        <Stat label="People waiting to join" value={String(waitingPeople)} warn={waitingPeople > 0} href="/treasurer/people" />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Needs your decision</h2>
        <div className="mb-3">
          <ErrorText>{error}</ErrorText>
        </div>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card p-6 text-muted">Nothing to decide right now. Requests that need you will show up here.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((c) => (
              <li key={c.id} className="rounded-2xl border border-line bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p>
                      <span className="font-semibold">{c.memberName}</span> <span className="text-muted">at {c.receipt.vendor}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusChip status="pending_review" />
                      <span className="text-sm text-muted">{c.rule}</span>
                    </div>
                    {c.imageId && (
                      <a href={`/api/claims/${c.id}/image`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">
                        View receipt photo
                      </a>
                    )}
                  </div>
                  <p className="text-2xl font-bold tabular-nums">${c.receipt.total.toFixed(2)}</p>
                  {confirming?.id !== c.id && (
                    <div className="flex gap-2">
                      <button disabled={busy === c.id} onClick={() => ask(c, "approve")} className={smallPrimaryBtn}>
                        Approve and pay
                      </button>
                      <button disabled={busy === c.id} onClick={() => ask(c, "deny")} className={smallDangerBtn}>
                        Deny
                      </button>
                    </div>
                  )}
                </div>

                {confirming?.id === c.id && confirming.action === "approve" && (
                  <div role="group" aria-label="Confirm payment" className="mt-4 rounded-xl border border-brand/40 bg-soft p-4">
                    <p className="font-semibold">Are you sure? This sends real money from your PayPal.</p>
                    <p className="mt-1 text-sm text-muted">
                      {c.memberName} will be paid at {c.memberEmail ?? "their PayPal email"}. They’ll get a text.
                    </p>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <label className="text-sm font-medium text-muted">
                        Amount to pay
                        <span className="mt-1 flex items-center gap-1 rounded-xl border border-line bg-card px-3">
                          <span className="text-ink">$</span>
                          <input
                            aria-label="Amount to pay"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-10 w-28 bg-transparent text-ink focus:outline-none"
                          />
                        </span>
                      </label>
                      <p className="pb-2 text-xs text-muted">Pay less than ${c.receipt.total.toFixed(2)} for a partial reimbursement.</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button disabled={busy === c.id} onClick={() => act(c.id, "approve")} className={smallPrimaryBtn}>
                        {busy === c.id ? "Paying…" : "Yes, pay"}
                      </button>
                      <button disabled={busy === c.id} onClick={() => setConfirming(null)} className={smallGhostBtn}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {confirming?.id === c.id && confirming.action === "deny" && (
                  <div role="group" aria-label="Confirm denial" className="mt-4 rounded-xl border border-accent/40 bg-accent-soft p-4">
                    <p className="font-semibold">Are you sure you want to deny this?</p>
                    <p className="mt-1 text-sm text-muted">{c.memberName} won’t be paid and will get a text. You can’t undo this.</p>
                    <div className="mt-4 flex gap-2">
                      <button disabled={busy === c.id} onClick={() => act(c.id, "deny")} className={smallDangerSolidBtn}>
                        {busy === c.id ? "Denying…" : "Yes, deny"}
                      </button>
                      <button disabled={busy === c.id} onClick={() => setConfirming(null)} className={smallGhostBtn}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <AuditGrid claims={claims} />

      <section className="mt-12">
        <details className="rounded-2xl border border-line bg-card p-5">
          <summary className="cursor-pointer text-[15px] font-semibold">Text messages we’ve sent ({texts.messages.length})</summary>
          {texts.mode === "demo" && (
            <p className="mt-3 rounded-xl bg-wa-bg px-4 py-3 text-sm text-wa-tx">Texts are in demo mode, so they’re saved here but not sent to phones. Add your Twilio details to send them for real.</p>
          )}
          {texts.messages.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No texts yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {texts.messages.map((m) => (
                <li key={m.id} className="py-3 text-sm">
                  <p className="text-ink">{m.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    To {m.to} · {TEXT_STATUS[m.status] ?? m.status}
                    {m.error ? ` (${m.error})` : ""} · {new Date(m.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </details>
      </section>
    </main>
  );
}
