"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoNote } from "@/components/DemoAccess";
import { ErrorText, Field, ORG_TYPE_LABEL, inputClass, primaryBtn } from "@/components/ui";

export default function OrgSignupPage() {
  const router = useRouter();
  const [f, setF] = useState({ orgName: "", orgType: "school_club", name: "", email: "", phone: "", password: "", paypalBusinessEmail: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register-org", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn’t create your account.");
      router.push("/treasurer/rules");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t create your account.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Set up your organization</h1>
      <DemoNote />
      <p className="mt-3 text-lg text-muted">Create the treasurer account. You’ll set your spending rules next, then invite or approve your people.</p>

      <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">About your organization</h2>
        <Field id="orgName" label="Organization name">
          <input id="orgName" required className={inputClass} value={f.orgName} onChange={set("orgName")} placeholder="e.g. Robotics Club" />
        </Field>
        <Field id="orgType" label="What kind of organization is it?">
          <select id="orgType" className={inputClass} value={f.orgType} onChange={set("orgType")}>
            {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field id="paypalBusinessEmail" label="PayPal business email (optional)" hint="Kept on your records. In this demo, payments come from the PayPal sandbox account connected to Pockit.">
          <input id="paypalBusinessEmail" type="email" className={inputClass} value={f.paypalBusinessEmail} onChange={set("paypalBusinessEmail")} />
        </Field>

        <h2 className="pt-3 text-xl font-semibold">About you</h2>
        <Field id="name" label="Your name">
          <input id="name" required autoComplete="name" className={inputClass} value={f.name} onChange={set("name")} />
        </Field>
        <Field id="email" label="Email">
          <input id="email" type="email" required autoComplete="email" className={inputClass} value={f.email} onChange={set("email")} />
        </Field>
        <Field id="phone" label="Mobile phone (optional)" hint="We’ll text you when a request needs your review. Message and data rates may apply. Leave blank to skip texts.">
          <input id="phone" type="tel" autoComplete="tel" className={inputClass} value={f.phone} onChange={set("phone")} placeholder="(404) 555-0123" />
        </Field>
        <Field id="password" label="Password" hint="At least 8 characters.">
          <input id="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} value={f.password} onChange={set("password")} />
        </Field>

        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
          {busy ? "Creating account…" : "Create organization"}
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
