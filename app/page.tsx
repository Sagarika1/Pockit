import Link from "next/link";
import { Check, ghostBtn, primaryBtn } from "@/components/ui";

const WHO = [
  {
    title: "Student clubs and campus groups",
    body: "Officers buy food, supplies and tickets with their own money, then wait on the treasurer or the student org office to pay them back.",
    examples: "Robotics club, cultural orgs, Greek life, intramural teams",
  },
  {
    title: "Volunteer organizations",
    body: "Coordinators pick up supplies, food and gas for events. There’s rarely a company card, so they cover it themselves.",
    examples: "Food banks, tutoring programs, neighborhood cleanups, mutual aid groups",
  },
  {
    title: "Small nonprofits",
    body: "Staff and volunteers pay first and send receipts by email, text and paper. Someone has to sort it all out.",
    examples: "Community centers, youth leagues, local charities",
  },
];

const PAIN_MEMBER = [
  ["They pay first.", "Students and volunteers cover costs out of pocket, even when money is tight."],
  ["They wait.", "Getting paid back takes weeks, and they have to keep asking."],
  ["They guess.", "Nobody knows what’s covered until a request is turned down."],
  ["Receipts get lost.", "Paper fades and photos disappear into a camera roll."],
];

const PAIN_TREASURER = [
  ["Receipts come from everywhere.", "Texts, DMs, email and paper, all needing a reply."],
  ["Every one is checked by hand.", "Is it the right category? Under the limit? On the right dates?"],
  ["Paying is a chore.", "One-off bank transfers, checks or cash for every request."],
  ["There’s no record.", "When an advisor or the university asks where the money went, it’s a scramble."],
];

const STEPS = [
  { n: "1", title: "Set your rules once", body: "Treasurers choose spending limits, event dates and what’s off limits. Or upload your policy and Pockit fills the rules in for you to check." },
  { n: "2", title: "Members snap a receipt", body: "Pockit reads the store, date, total and type of purchase from the photo." },
  { n: "3", title: "Your rules decide", body: "If a receipt follows your rules, it’s paid through PayPal right away. If not, your treasurer approves or denies it in one click." },
  { n: "4", title: "Everyone stays in the loop", body: "Members get a text with the result. Every decision is saved in a log you can search and export." },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-line bg-soft">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="mb-4 text-sm font-semibold text-brand">For campus clubs, volunteer groups and nonprofits</p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Pay your members back in minutes, not weeks.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Pockit turns a receipt photo into a reimbursement. A member snaps a receipt. Pockit checks it against your rules and pays them through PayPal, or sends it to your treasurer to decide.
            </p>
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
                  <p className="text-sm text-muted">Nov 13 · Meals</p>
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

      {/* Who it's for */}
      <section id="who" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16 lg:px-10 lg:py-20">
        <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Built for groups that run on volunteers and tight budgets</h2>
        <p className="mt-3 max-w-2xl text-lg text-muted">On campus and across the city, the people who keep these groups going are often the ones paying for things first.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {WHO.map((w) => (
            <div key={w.title} className="flex flex-col rounded-2xl border border-line bg-card p-6">
              <h3 className="text-lg font-semibold">{w.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{w.body}</p>
              <p className="mt-auto pt-5 text-sm text-ink">
                <span className="font-semibold text-brand">Like: </span>
                {w.examples}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The problem */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Reimbursements are slow and stressful for everyone</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {[
              { heading: "For the person who paid", list: PAIN_MEMBER },
              { heading: "For the treasurer", list: PAIN_TREASURER },
            ].map((col) => (
              <div key={col.heading} className="rounded-2xl border border-line bg-page p-6 sm:p-8">
                <h3 className="text-xl font-semibold">{col.heading}</h3>
                <ul className="mt-5 space-y-4">
                  {col.list.map(([lead, rest]) => (
                    <li key={lead} className="text-[15px] leading-relaxed text-muted">
                      <span className="font-semibold text-ink">{lead}</span> {rest}
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
        <p className="mt-3 max-w-2xl text-lg text-muted">Pockit does the busywork, and your treasurer stays in charge.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-card p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold text-on-brand">{s.n}</span>
              <h3 className="mb-1.5 text-lg font-semibold">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 rounded-2xl border border-line bg-soft px-6 py-5 text-lg font-semibold">
          Pockit reads the receipt. Your rules decide who gets paid.
        </p>
      </section>

      {/* Benefits */}
      <section className="border-t border-line bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-2 lg:px-10 lg:py-20">
          {[
            { heading: "For members", items: ["Get paid back in minutes, not weeks", "See what’s covered before you spend", "Get a text when your request is approved, denied or needs a look"] },
            { heading: "For treasurers", items: ["Stop chasing receipts and doing math", "Approve the exceptions in one click", "Add people or approve join requests in seconds", "Keep a log you can export for your advisor or school"] },
          ].map((col) => (
            <div key={col.heading}>
              <h3 className="text-2xl font-bold tracking-tight">{col.heading}</h3>
              <ul className="mt-5 space-y-3">
                {col.items.map((i) => (
                  <li key={i} className="flex items-start gap-3 text-[16px]">
                    <Check className="mt-0.5" />
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
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-14 lg:flex-row lg:items-center lg:px-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Ready to stop fronting cash?</h2>
            <p className="mt-2 text-lg text-muted">Set up your organization in a few minutes, or ask to join the one you’re part of.</p>
          </div>
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
