"use client";
import { useCallback, useEffect, useState } from "react";
import { ErrorText, Field, KIND_LABEL, PageLoading, SuccessText, inputClass, primaryBtn, smallGhostBtn, smallPrimaryBtn } from "@/components/ui";
import { useRequireRole } from "@/components/useMe";

type Person = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  paypalEmail: string | null;
  kind: keyof typeof KIND_LABEL;
  status: "pending" | "approved" | "denied" | "removed";
  addedBy: "self" | "treasurer";
  createdAt: string;
};

const EMPTY = { name: "", email: "", phone: "", paypalEmail: "", kind: "student", password: "" };

export default function PeoplePage() {
  const { ready } = useRequireRole("treasurer");
  const [people, setPeople] = useState<Person[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [f, setF] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [added, setAdded] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const load = useCallback(async () => {
    const res = await fetch("/api/people", { cache: "no-store" });
    if (res.ok) setPeople(await res.json());
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function act(id: string, action: "approve" | "deny" | "remove") {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/people/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    if (!res.ok) setError((await res.json()).error || "Something went wrong.");
    await load();
    setBusy("");
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError("");
    setAdded("");
    const res = await fetch("/api/people", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) return setAddError(data.error || "Something went wrong.");
    setAdded(
      data.tempPassword
        ? `${data.name} is in. Their temporary password is ${data.tempPassword}. Share it with them privately. They log in with their email.`
        : `${data.name} already had a Pockit account and has been added to your organization.`
    );
    setF(EMPTY);
    load();
  }

  if (!ready) return <PageLoading />;

  const waiting = people.filter((p) => p.status === "pending");
  const members = people.filter((p) => p.status === "approved");
  const declined = people.filter((p) => p.status === "denied");

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">People</h1>
      <div className="mt-2 h-1 w-9 rounded-full bg-accent" aria-hidden="true" />
      <p className="mt-2 text-lg text-muted">Approve people who ask to join, or add them yourself. Only approved people can submit receipts.</p>

      <div className="mt-8">
        <ErrorText>{error}</ErrorText>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Waiting for your approval ({waiting.length})</h2>
        {waiting.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card p-6 text-muted">No one is waiting. When someone asks to join, they’ll show up here.</p>
        ) : (
          <ul className="space-y-3">
            {waiting.map((p) => (
              <li key={p.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {p.name} <span className="font-normal text-muted">· {KIND_LABEL[p.kind]}</span>
                  </p>
                  <p className="truncate text-sm text-muted">{p.email}</p>
                </div>
                <div className="flex gap-2">
                  <button disabled={busy === p.id} onClick={() => act(p.id, "approve")} className={smallPrimaryBtn}>
                    Approve
                  </button>
                  <button disabled={busy === p.id} onClick={() => act(p.id, "deny")} className={smallGhostBtn}>
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Your people ({members.length})</h2>
          {members.length === 0 ? (
            <p className="rounded-2xl border border-line bg-card p-6 text-muted">No one yet. Add someone with the form, or approve a request above.</p>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
              {members.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {p.name} <span className="font-normal text-muted">· {KIND_LABEL[p.kind]}</span>
                    </p>
                    <p className="truncate text-sm text-muted">{p.email}</p>
                    <p className="truncate text-sm text-muted">
                      PayPal: {p.paypalEmail ?? p.email}
                      {p.phone ? ` · Texts to ${p.phone.slice(-4).padStart(p.phone.length, "•")}` : " · No phone number"}
                    </p>
                  </div>
                  <button disabled={busy === p.id} onClick={() => act(p.id, "remove")} className={smallGhostBtn}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {declined.length > 0 && (
            <details className="mt-4 rounded-2xl border border-line bg-card p-5">
              <summary className="cursor-pointer text-[15px] font-semibold">Declined requests ({declined.length})</summary>
              <ul className="mt-3 divide-y divide-line">
                {declined.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <p className="min-w-0 flex-1 truncate text-sm">
                      <span className="font-semibold">{p.name}</span> <span className="text-muted">{p.email}</span>
                    </p>
                    <button disabled={busy === p.id} onClick={() => act(p.id, "approve")} className={smallGhostBtn}>
                      Approve instead
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Add someone</h2>
          <form onSubmit={add} className="space-y-4 rounded-2xl border border-line bg-card p-5 sm:p-6">
            <Field id="p-name" label="Name">
              <input id="p-name" required className={inputClass} value={f.name} onChange={set("name")} />
            </Field>
            <Field id="p-email" label="Email">
              <input id="p-email" type="email" required className={inputClass} value={f.email} onChange={set("email")} />
            </Field>
            <Field id="p-kind" label="They are a…">
              <select id="p-kind" className={inputClass} value={f.kind} onChange={set("kind")}>
                {Object.entries(KIND_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="p-paypal" label="PayPal email (optional)" hint="Where their reimbursements go. Leave blank to use their email.">
              <input id="p-paypal" type="email" className={inputClass} value={f.paypalEmail} onChange={set("paypalEmail")} />
            </Field>
            <Field id="p-phone" label="Mobile phone (optional)" hint="So they get texts about their requests. Only add a number if they’ve agreed to get texts.">
              <input id="p-phone" type="tel" className={inputClass} value={f.phone} onChange={set("phone")} placeholder="(404) 555-0123" />
            </Field>
            <Field id="p-password" label="Temporary password (optional)" hint="Leave blank and we’ll make one for you.">
              <input id="p-password" type="text" minLength={8} className={inputClass} value={f.password} onChange={set("password")} />
            </Field>
            <ErrorText>{addError}</ErrorText>
            <SuccessText>{added}</SuccessText>
            <button type="submit" disabled={adding} className={`${primaryBtn} w-full`}>
              {adding ? "Adding…" : "Add to my organization"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
