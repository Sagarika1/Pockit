"use client";
import { useCallback, useEffect, useState } from "react";
import StatusChip from "@/components/StatusChip";
import { ErrorText, Field, KIND_LABEL, PageLoading, ghostBtn, inputClass, primaryBtn, smallGhostBtn, smallPrimaryBtn } from "@/components/ui";
import { useRequireRole, type Membership } from "@/components/useMe";
import type { Receipt } from "@/lib/policy";
import { prepareReceiptImage } from "@/lib/compressImage";
import { describeRules, type Rules } from "@/lib/rules";

type ClaimRow = { id: string; status: string; rule: string; receipt: Receipt; createdAt: string; memberEmail: string; payAmount?: number };
const partOf = (c: { status: string; payAmount?: number; receipt: Receipt }) => (c.payAmount !== undefined && c.payAmount < c.receipt.total ? c.payAmount : null);
type Step = "upload" | "reading" | "confirm" | "submitting" | "done";

// Test receipts the site serves itself, so nobody has to download anything
const SAMPLES = [
  { file: "meals-over-cap.png", label: "Team dinner", note: "Over the limit: part paid" },
  { file: "meals-under-cap.png", label: "Lunch", note: "Paid in full" },
  { file: "rideshare-under-cap.png", label: "Rideshare", note: "Paid in full" },
  { file: "hotel.png", label: "Hotel", note: "Treasurer decides" },
  { file: "flight.png", label: "Flight", note: "Treasurer decides" },
  { file: "registration.png", label: "Registration", note: "Event fee" },
  { file: "other-supplies.png", label: "Supplies", note: "Other purchases" },
  { file: "meals-with-beer.png", label: "Dinner with beer", note: "Alcohol: not approved" },
];

const RESULT: Record<string, { title: string; style: string }> = {
  paid: { title: "Approved and paid", style: "bg-ok-bg text-ok-tx border-ok-tx/30" },
  pending_review: { title: "Waiting approval", style: "bg-wa-bg text-wa-tx border-wa-tx/30" },
  rejected: { title: "Not approved", style: "bg-no-bg text-no-tx border-no-tx/30" },
  payout_failed: { title: "Approved, but the payment didn’t go through", style: "bg-no-bg text-no-tx border-no-tx/30" },
};

function JoinAnother({ memberships, onDone }: { memberships: Membership[]; onDone: () => void }) {
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [orgId, setOrgId] = useState("");
  const [kind, setKind] = useState("student");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/orgs", { cache: "no-store" })
      .then((r) => r.json())
      .then(setOrgs)
      .catch(() => {});
  }, []);

  const taken = new Set(memberships.filter((m) => m.status === "pending" || m.status === "approved").map((m) => m.orgId));
  const options = orgs.filter((o) => !taken.has(o.id));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/memberships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId, kind }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Something went wrong.");
    setOrgId("");
    onDone();
  }

  if (options.length === 0) return <p className="text-sm text-muted">There are no other organizations to join yet.</p>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="join-org" label="Organization">
        <select id="join-org" required className={inputClass} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
          <option value="">Choose one</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </Field>
      <Field id="join-kind" label="You are a…">
        <select id="join-kind" className={inputClass} value={kind} onChange={(e) => setKind(e.target.value)}>
          {Object.entries(KIND_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={busy} className={smallPrimaryBtn}>
        {busy ? "Sending…" : "Ask to join"}
      </button>
    </form>
  );
}

export default function SubmitPage() {
  const { me, ready, refresh } = useRequireRole("member");
  const [orgChoice, setOrgChoice] = useState("");
  const [rules, setRules] = useState<Rules | null>(null);
  const [history, setHistory] = useState<ClaimRow[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [token, setToken] = useState("");
  const [imageId, setImageId] = useState("");
  const [claim, setClaim] = useState<ClaimRow | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState("");
  const [askBusy, setAskBusy] = useState("");

  const memberships = me?.memberships ?? [];
  const approved = memberships.filter((m) => m.status === "approved");
  const orgId = approved.some((m) => m.orgId === orgChoice) ? orgChoice : (approved[0]?.orgId ?? "");

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/claims", { cache: "no-store" });
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => {
    if (ready) loadHistory();
  }, [ready, loadHistory]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    fetch(`/api/rules?orgId=${encodeURIComponent(orgId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.rules) setRules(d.rules);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  async function readFile(file: File) {
    setStep("reading");
    setError("");
    const form = new FormData();
    try {
      form.append("receipt", await prepareReceiptImage(file)); // shrinks big phone photos first
      const res = await fetch("/api/parse-receipt", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "We couldn’t read that receipt.");
      const { receiptToken, imageId: savedImage, ...rest } = data as Receipt & { receiptToken: string; imageId?: string };
      setReceipt(rest);
      setToken(receiptToken);
      setImageId(savedImage ?? "");
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("upload");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so the same photo can be picked again
    if (file) await readFile(file);
  }

  // One tap on a sample receipt: load the picture from the site and read it like an uploaded photo
  async function useSample(s: { file: string; label: string }) {
    setStep("reading");
    setError("");
    try {
      const res = await fetch(`/sample-receipts/${s.file}`);
      if (!res.ok) throw new Error("Couldn’t load that sample.");
      const blob = await res.blob();
      await readFile(new File([blob], s.file, { type: blob.type || "image/png" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("upload");
    }
  }

  async function submit() {
    setStep("submitting");
    setError("");
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receipt, receiptToken: token, orgId, imageId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setReceipt(null);
      setStep("upload");
      return;
    }
    setClaim(data);
    setStep("done");
    loadHistory();
  }

  function reset() {
    setReceipt(null);
    setClaim(null);
    setToken("");
    setImageId("");
    setError("");
    setStep("upload");
  }

  async function askAgain(m: Membership) {
    setAskBusy(m.id);
    await fetch("/api/memberships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId: m.orgId, kind: m.kind }) });
    await refresh();
    setAskBusy("");
  }

  if (!ready) return <PageLoading />;

  const others = memberships.filter((m) => m.status !== "approved");

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Submit a receipt</h1>
      <div className="mt-2 h-1 w-9 rounded-full bg-accent" aria-hidden="true" />
      <p className="mt-2 text-lg text-muted">Take a photo of your receipt. You’ll hear back in minutes.</p>

      {others.length > 0 && (
        <section className="mt-8 space-y-3">
          {others.map((m) => (
            <div key={m.id} className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center ${m.status === "pending" ? "border-wa-tx/30 bg-wa-bg text-wa-tx" : "border-no-tx/30 bg-no-bg text-no-tx"}`}>
              <div className="flex-1">
                <p className="font-semibold">{m.status === "pending" ? `Waiting for ${m.orgName} to approve you` : `${m.orgName} didn’t approve your request`}</p>
                <p className="mt-1 text-sm">
                  {m.status === "pending"
                    ? "Your treasurer needs to approve you before you can submit receipts. Check back here, or we’ll text you if you added a phone number."
                    : "Reach out to your treasurer if you think this is a mistake."}
                </p>
              </div>
              {m.status === "denied" && (
                <button onClick={() => askAgain(m)} disabled={askBusy === m.id} className={smallGhostBtn}>
                  Ask again
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {approved.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="rounded-3xl border border-line bg-card p-6 sm:p-8">
            {approved.length > 1 && (
              <div className="mb-6">
                <Field id="org" label="This receipt is for">
                  <select id="org" className={inputClass} value={orgId} onChange={(e) => setOrgChoice(e.target.value)}>
                    {approved.map((m) => (
                      <option key={m.orgId} value={m.orgId}>
                        {m.orgName}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            {step === "upload" && (
              <label className="flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-brand bg-soft px-5 py-12 text-center hover:opacity-90 focus-within:ring-2 focus-within:ring-brand">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-on-brand" aria-hidden="true">
                    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                </span>
                <span className="text-lg font-semibold">Upload a receipt photo</span>
                <span className="text-sm text-muted">JPG, PNG or WebP · or use your camera</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="sr-only" />
              </label>
            )}

            {step === "upload" && (
              <div className="mt-6">
                <p className="font-semibold">No receipt handy? Tap a sample.</p>
                {me?.demoReader && <p className="mt-1 text-sm text-muted">Demo mode: only these samples can be read.</p>}
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {SAMPLES.map((s) => (
                    <li key={s.file}>
                      <button type="button" onClick={() => useSample(s)} className="group w-full rounded-xl border border-line bg-card p-2 text-left transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-brand">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/sample-receipts/${s.file}`} alt="" loading="lazy" className="h-24 w-full rounded-lg bg-soft object-cover object-top" />
                        <span className="mt-2 block text-sm font-semibold">{s.label}</span>
                        <span className="block text-xs text-muted">{s.note}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step === "reading" && <p className="p-10 text-center text-muted">Reading your receipt…</p>}

            {(step === "confirm" || step === "submitting") && receipt && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">Does this look right?</h2>
                <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[15px]">
                  <dt className="text-muted">Store</dt>
                  <dd>{receipt.vendor}</dd>
                  <dt className="text-muted">Date</dt>
                  <dd>{receipt.date ?? "We couldn’t read it"}</dd>
                  <dt className="text-muted">Total</dt>
                  <dd className="font-semibold">${receipt.total.toFixed(2)}</dd>
                  <dt className="text-muted">Type</dt>
                  <dd className="capitalize">{receipt.category}</dd>
                  <dt className="text-muted">Paid to</dt>
                  <dd className="break-all">{me?.user?.paypalEmail ?? me?.user?.email}</dd>
                </dl>
                {receipt.needs_review && (
                  <p className="mb-5 rounded-xl border border-wa-tx/30 bg-wa-bg px-4 py-3 text-sm text-wa-tx">
                    Part of this receipt was hard to read, so your treasurer will take a look.
                    {receipt.review_reason ? ` (${receipt.review_reason})` : ""}
                  </p>
                )}
                <div className="flex gap-3">
                  <button onClick={submit} disabled={step === "submitting"} className={`${primaryBtn} flex-1`}>
                    {step === "submitting" ? "Submitting…" : "Submit for reimbursement"}
                  </button>
                  <button onClick={reset} className={ghostBtn}>
                    Retake
                  </button>
                </div>
              </div>
            )}

            {step === "done" && claim && (
              <div className={`rounded-2xl border p-6 ${RESULT[claim.status]?.style ?? "border-line bg-card"}`}>
                <h2 className="mb-1 text-xl font-semibold">{RESULT[claim.status]?.title ?? claim.status}</h2>
                <p className="mb-2 text-2xl font-bold">
                  {partOf(claim) !== null ? `$${partOf(claim)!.toFixed(2)} of $${claim.receipt.total.toFixed(2)}` : `$${claim.receipt.total.toFixed(2)}`} · {claim.receipt.vendor}
                </p>
                <p className="mb-1 text-[15px]">{claim.rule}</p>
                {claim.status === "paid" && <p className="text-sm">Sent to {claim.memberEmail}.</p>}
                {me?.user?.phone && <p className="mt-1 text-sm">We texted you the result.</p>}
                <button onClick={reset} className={`${smallGhostBtn} mt-5 border-current bg-transparent`}>
                  Submit another receipt
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4">
                <ErrorText>{error}</ErrorText>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            {rules && (
              <section className="rounded-3xl border border-line bg-card p-6">
                <h2 className="text-lg font-semibold">What’s covered</h2>
                <ul className="mt-3 space-y-2 text-[15px] text-muted">
                  {describeRules(rules).map((line) => (
                    <li key={line}>• {line}</li>
                  ))}
                </ul>
              </section>
            )}
            <section className="rounded-3xl border border-line bg-card p-6">
              <h2 className="text-lg font-semibold">Your recent requests</h2>
              {history.length === 0 ? (
                <p className="mt-3 text-[15px] text-muted">Nothing yet. Your requests will show up here.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {history.slice(0, 6).map((c) => (
                    <li key={c.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.receipt.vendor}</p>
                        <p className="truncate text-sm text-muted">{c.rule}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold tabular-nums">
                          {partOf(c) !== null ? `$${partOf(c)!.toFixed(2)} of $${c.receipt.total.toFixed(2)}` : `$${c.receipt.total.toFixed(2)}`}
                        </span>
                        <StatusChip status={c.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}

      <section className="mt-10">
        <details className="rounded-2xl border border-line bg-card p-5" open={approved.length === 0 && others.length === 0}>
          <summary className="cursor-pointer text-[15px] font-semibold">Join another organization</summary>
          <div className="mt-4 max-w-md">
            <JoinAnother memberships={memberships} onDone={refresh} />
          </div>
        </details>
      </section>
    </main>
  );
}
