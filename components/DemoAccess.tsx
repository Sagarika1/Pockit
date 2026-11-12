"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ghostBtn, primaryBtn } from "@/components/ui";
import { useMe } from "@/components/useMe";

export const DEMO_PASSWORD = "pockit-demo-2026";
export const DEMO_ACCOUNTS = {
  member: { email: "demo-member@pockit.demo", label: "Demo member" },
  treasurer: { email: "demo-treasurer@pockit.demo", label: "Demo treasurer" },
} as const;

/** Logs in as a demo account in one click. Returns an error message, or "" when it worked. */
export async function loginAsDemo(as: "member" | "treasurer"): Promise<string> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_ACCOUNTS[as].email, password: DEMO_PASSWORD, as }),
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? "" : data.error || "Couldn’t log you in.";
}

/** "Try the demo" button for the landing page: logs in as the demo member straight away. Only when the demo is on and nobody is logged in. */
export function TryDemoButton() {
  const router = useRouter();
  const { me, loading } = useMe();
  const [busy, setBusy] = useState(false);
  if (loading || me?.user || !me?.demo) return null;
  return (
    <button
      type="button"
      disabled={busy}
      className={primaryBtn}
      onClick={async () => {
        setBusy(true);
        const err = await loginAsDemo("member");
        if (err) {
          setBusy(false);
          router.push("/login");
          return;
        }
        setBusy(false);
        router.push("/submit");
      }}
    >
      {busy ? "Opening the demo…" : "Try the demo"}
    </button>
  );
}

/** A note on the sign-up pages, so people testing the demo don't create an account by accident. */
export function DemoNote() {
  const { me, loading } = useMe();
  if (loading || me?.user || !me?.demo) return null;
  return (
    <div className="mt-6 rounded-2xl border-2 border-brand bg-soft p-5">
      <p className="font-semibold">Just testing Pockit?</p>
      <p className="mt-1 text-sm text-muted">Skip sign-up. Use a demo login, with test accounts already set up so PayPal payments work.</p>
      <Link href="/login" className={`${ghostBtn} mt-3 !h-10 !px-5 !text-sm`}>
        Go to the demo logins
      </Link>
    </div>
  );
}
