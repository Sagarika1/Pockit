"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DemoNote } from "@/components/DemoAccess";
import { ErrorText, Field, KIND_LABEL, inputClass, primaryBtn } from "@/components/ui";

type OrgOption = { id: string; name: string; type: string };

export default function MemberSignupPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgOption[] | null>(null);
  const [f, setF] = useState({ orgId: "", kind: "student", name: "", email: "", phone: "", paypalEmail: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    fetch("/api/orgs", { cache: "no-store" })
      .then((r) => r.json())
      .then((list: OrgOption[]) => setOrgs(list))
      .catch(() => setOrgs([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register-member", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn’t create your account.");
      router.push("/submit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t create your account.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Join your organization</h1>
      <DemoNote />
      <p className="mt-3 text-lg text-muted">Create your account and ask to join. Your treasurer approves you, then you can submit receipts.</p>

      <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-line bg-card p-6 sm:p-8">
        {orgs !== null && orgs.length === 0 && (
          <p className="rounded-xl border border-wa-tx/30 bg-wa-bg px-4 py-3 text-sm text-wa-tx">
            No organizations have signed up yet. Ask your treasurer to{" "}
            <Link href="/signup/org" className="font-semibold underline">
              set up your organization
            </Link>{" "}
            first.
          </p>
        )}
        <Field id="orgId" label="Which organization are you joining?">
          <select id="orgId" required className={inputClass} value={f.orgId} onChange={set("orgId")}>
            <option value="">{orgs === null ? "Loading…" : "Choose one"}</option>
            {(orgs ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="kind" label="You are a…">
          <select id="kind" className={inputClass} value={f.kind} onChange={set("kind")}>
            {Object.entries(KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <h2 className="pt-3 text-xl font-semibold">About you</h2>
        <Field id="name" label="Your name">
          <input id="name" required autoComplete="name" className={inputClass} value={f.name} onChange={set("name")} />
        </Field>
        <Field id="email" label="Email">
          <input id="email" type="email" required autoComplete="email" className={inputClass} value={f.email} onChange={set("email")} />
        </Field>
        <Field id="paypalEmail" label="PayPal email" hint="Where your reimbursements are sent. Leave blank to use the email above.">
          <input id="paypalEmail" type="email" className={inputClass} value={f.paypalEmail} onChange={set("paypalEmail")} />
        </Field>
        <Field id="phone" label="Mobile phone (optional)" hint="We’ll text you when your request is approved, denied or needs a look. Message and data rates may apply. Leave blank to skip texts.">
          <input id="phone" type="tel" autoComplete="tel" className={inputClass} value={f.phone} onChange={set("phone")} placeholder="(404) 555-0123" />
        </Field>
        <Field id="password" label="Password" hint="At least 8 characters.">
          <input id="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} value={f.password} onChange={set("password")} />
        </Field>

        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
          {busy ? "Creating account…" : "Ask to join"}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
