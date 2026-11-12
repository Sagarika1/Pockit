"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorText, Field, inputClass, primaryBtn, smallGhostBtn } from "@/components/ui";
import { useMe } from "@/components/useMe";

type Tab = "member" | "treasurer";

const COPY: Record<Tab, { heading: string; sub: string; signup: string; signupHref: string }> = {
  member: {
    heading: "Member log in",
    sub: "For students, employees and volunteers. Log in to submit receipts and see your requests.",
    signup: "New here? Ask to join an organization",
    signupHref: "/signup/member",
  },
  treasurer: {
    heading: "Organization log in",
    sub: "For treasurers and finance officers. Log in to review claims, manage people and set your rules.",
    signup: "No account yet? Set up your organization",
    signupHref: "/signup/org",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { me } = useMe();
  const [tab, setTab] = useState<Tab>("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Demo accounts (only offered when the demo is switched on). The password is public in the README.
  function fillDemo(as: Tab, demoEmail: string) {
    setTab(as);
    setEmail(demoEmail);
    setPassword("pockit-demo-2026");
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, as: tab }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn’t log you in.");
      router.push(data.role === "treasurer" ? "/treasurer" : "/submit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t log you in.");
      setBusy(false);
    }
  }

  const c = COPY[tab];
  return (
    <main className="mx-auto max-w-xl px-6 py-12 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Log in</h1>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-line bg-card p-1" role="group" aria-label="Account type">
        {(["member", "treasurer"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              setError("");
            }}
            className={`h-11 rounded-full text-[15px] font-semibold transition-colors ${tab === t ? "bg-brand text-on-brand" : "text-muted hover:text-ink"}`}
          >
            {t === "member" ? "Member" : "Organization"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div>
          <h2 className="text-xl font-semibold">{c.heading}</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">{c.sub}</p>
        </div>
        <Field id="email" label="Email">
          <input id="email" type="email" autoComplete="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="password" label="Password">
          <input id="password" type="password" autoComplete="current-password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>
          {busy ? "Logging in…" : "Log in"}
        </button>
        <p className="text-center text-sm">
          <Link href={c.signupHref} className="font-semibold text-brand hover:underline">
            {c.signup}
          </Link>
        </p>
      </form>

      {me?.demo && (
        <div className="mt-6 rounded-2xl border border-line bg-soft p-5" aria-label="Demo logins">
          <p className="font-semibold">Trying the demo?</p>
          <p className="mt-1 text-sm text-muted">Fill in a demo login with one click, then press Log in.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={smallGhostBtn} onClick={() => fillDemo("treasurer", "demo-treasurer@pockit.demo")}>
              Demo treasurer
            </button>
            <button type="button" className={smallGhostBtn} onClick={() => fillDemo("member", "demo-member@pockit.demo")}>
              Demo member
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
