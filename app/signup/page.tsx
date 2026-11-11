import Link from "next/link";

const CHOICES = [
  {
    href: "/signup/org",
    title: "I run an organization",
    who: "Treasurers, finance officers and club or nonprofit leaders",
    points: ["Set your spending rules", "Approve who can submit receipts", "Review anything that needs a decision"],
    cta: "Set up your organization",
  },
  {
    href: "/signup/member",
    title: "I’m a student, employee or volunteer",
    who: "Anyone who pays for things and needs to be paid back",
    points: ["Ask to join your organization", "Snap receipts from your phone", "Get a text when you’re paid"],
    cta: "Join an organization",
  },
];

export default function SignupChooser() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Get started with Pockit</h1>
      <p className="mt-3 text-lg text-muted">Which one sounds like you?</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {CHOICES.map((c) => (
          <Link key={c.href} href={c.href} className="group flex flex-col rounded-3xl border border-line bg-card p-6 transition-colors hover:border-brand sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">{c.title}</h2>
            <p className="mt-2 text-[15px] text-muted">{c.who}</p>
            <ul className="mt-5 space-y-2 text-[15px]">
              {c.points.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
            <span className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 font-semibold text-on-brand group-hover:opacity-90">{c.cta}</span>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
