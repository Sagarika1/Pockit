import type { ReactNode } from "react";

// Shared look for forms and buttons, so every page matches.
export const inputClass =
  "h-12 w-full rounded-xl border border-line bg-page px-3.5 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
export const primaryBtn = `inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-[15px] font-semibold text-on-brand transition-opacity hover:opacity-90 disabled:opacity-50 ${focus}`;
export const ghostBtn = `inline-flex h-12 items-center justify-center rounded-full border border-line bg-card px-6 text-[15px] font-semibold text-ink transition-colors hover:bg-soft disabled:opacity-50 ${focus}`;
export const smallPrimaryBtn = `inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-on-brand transition-opacity hover:opacity-90 disabled:opacity-50 ${focus}`;
export const smallGhostBtn = `inline-flex h-10 items-center justify-center rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink transition-colors hover:bg-soft disabled:opacity-50 ${focus}`;

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border border-no-tx/30 bg-no-bg px-4 py-3 text-sm text-no-tx">
      {children}
    </p>
  );
}

export function SuccessText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="status" className="rounded-xl border border-ok-tx/30 bg-ok-bg px-4 py-3 text-sm text-ok-tx">
      {children}
    </p>
  );
}

export function PageLoading() {
  return <p className="mx-auto max-w-7xl px-6 py-16 text-muted lg:px-10">Loading…</p>;
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand ${className}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-on-brand" aria-hidden="true">
        <path d="M5 12l4 4 10-10" />
      </svg>
    </span>
  );
}

export const KIND_LABEL = { student: "Student", employee: "Employee", volunteer: "Volunteer" } as const;
export const ORG_TYPE_LABEL = { school_club: "Student club or campus group", volunteer: "Volunteer organization", nonprofit: "Nonprofit" } as const;
