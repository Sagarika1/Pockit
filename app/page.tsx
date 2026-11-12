import Link from "next/link";
import type { ReactNode } from "react";
import { Check, ghostBtn, primaryBtn } from "@/components/ui";

const icon = (children: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

// Who it's for: just listed, no captions
const WHO = [
  { label: "Student clubs", icon: icon(<><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1 3 3 6 3s6-2 6-3v-5" /></>) },
  { label: "Volunteer groups", icon: icon(<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />) },
  { label: "Small nonprofits", icon: icon(<><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6M9 11h.01M15 11h.01" /></>) },
];

const PAIN_MEMBER = ["Pay first", "Wait weeks", "Guess what’s covered", "Lose receipts"];
const PAIN_TREASURER = ["Chase receipts", "Check each one by hand", "Send payments one by one", "Scramble for records"];

const STEPS = [
  { n: "1", title: "Set your rules", body: "Pick limits and dates, or upload your policy." },
  { n: "2", title: "Snap a receipt", body: "Pockit reads it for you." },
  { n: "3", title: "Get a decision", body: "Follows the rules? Paid. If not, your treasurer decides." },
  { n: "4", title: "Get a text", body: "Every decision is saved and exportable." },
];

const MEMBER_BENEFITS = ["Get paid in minutes", "See what’s covered", "Get a text with the result"];
const TREASURER_BENEFITS = ["Stop chasing receipts", "Approve in one click", "Add people fast", "Export your log"];

// A short red bar under each section heading
const Bar = () => <div className="mt-2 h-1 w-9 rounded-full bg-accent" aria-hidden="true" />;

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-line bg-soft">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-brand">
              <span className="h-1 w-6 rounded-full bg-accent" aria-hidden="true" />
              Expense reimbursement for groups
            </p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Pay your members back in{" "}
              <span style={{ background: "linear-gradient(transparent 82%, var(--accent) 82%, var(--accent) 94%, transparent 94%)" }}>minutes</span>, not weeks.
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-snug text-muted">Snap a receipt. Get paid back through PayPal.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup/org" className={primaryBtn}>
                Set up your organization
              </Link>
              <Link href="/signup/member" className={ghostBtn}>
                Join your organization
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand hover:underline">
                Log in
              </Link>
            </p>
          </div>

          {/* Example of what a member sees */}
          <div aria-label="Example of an approved reimbursement" className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-line bg-card p-5 shadow-sm sm:p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">Example</p>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand" aria-hidden="true">
                    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
                    <path d="M9 8h6M9 12h6" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Joe’s Taco Shop</p>
                  <p className="text-sm text-muted">Nov 6 · Meals</p>
                </div>
                <p className="text-xl font-bold tabular-nums">$25.59</p>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-ok-bg px-4 py-3 text-sm text-ok-tx">
                <Check />
                <span>Within the $50 limit for meals. Paid to PayPal.</span>
              </div>
              <div className="mt-5 ml-auto w-[88%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-sm leading-relaxed text-on-brand">
                Pockit: Your reimbursement request was approved! $25.59 for Joe’s Taco Shop is on its way to your PayPal.
              </div>
              <p className="mt-2 text-right text-xs text-muted">Text message</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for: a plain list, no captions */}
      <section aria-label="Who Pockit is for" className="border-b border-line bg-card">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-7 md:gap-x-20 lg:gap-x-32 lg:px-10">
          {WHO.map((w) => (
            <li key={w.label} className="flex items-center gap-2.5 text-[17px] font-semibold">
              <span className="text-accent">{w.icon}</span>
              {w.label}
            </li>
          ))}
        </ul>
      </section>

      {/* The problem */}
      <section className="border-b border-line bg-card">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Reimbursements are slow for everyone</h2>
          <Bar />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              { heading: "The person who paid will", list: PAIN_MEMBER },
              { heading: "The treasurer will", list: PAIN_TREASURER },
            ].map((col) => (
              <div key={col.heading} className="rounded-2xl border border-line bg-page p-6 sm:p-8">
                <h3 className="text-xl font-semibold">{col.heading}</h3>
                <ul className="mt-5 space-y-3">
                  {col.list.map((item) => (
                    <li key={item} className="border-l-[3px] border-accent pl-3 text-[17px] font-semibold">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16 lg:px-10 lg:py-20">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Snap. Check. Paid.</h2>
        <Bar />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-card p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-on-brand">{s.n}</span>
              <h3 className="mb-1.5 text-lg font-semibold">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 rounded-r-2xl border border-l-4 border-line border-l-accent bg-soft px-6 py-5 text-lg font-semibold">
          Pockit reads the receipt. Your rules decide who gets paid.
        </p>
      </section>

      {/* Benefits */}
      <section className="border-t border-line bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-2 lg:px-10">
          {[
            { heading: "Members", items: MEMBER_BENEFITS },
            { heading: "Treasurers", items: TREASURER_BENEFITS },
          ].map((col) => (
            <div key={col.heading}>
              <h3 className="text-2xl font-bold tracking-tight">{col.heading}</h3>
              <ul className="mt-4 space-y-3">
                {col.items.map((i) => (
                  <li key={i} className="flex items-center gap-3 text-[17px]">
                    <Check />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Final call to action */}
      <section className="bg-soft">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-12 lg:flex-row lg:items-center lg:px-10">
          <h2 className="text-3xl font-bold tracking-tight">Ready to stop fronting cash?</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/signup/org" className={primaryBtn}>
              Set up your organization
            </Link>
            <Link href="/signup/member" className={ghostBtn}>
              Join your organization
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
