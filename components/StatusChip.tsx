const STYLES: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  paid: {
    label: "Paid",
    cls: "bg-ok-bg text-ok-tx",
    icon: <path d="M5 12l4 4 10-10" />,
  },
  rejected: {
    label: "Rejected",
    cls: "bg-no-bg text-no-tx",
    icon: <path d="M6 6l12 12M18 6L6 18" />,
  },
  payout_failed: {
    label: "Payout failed",
    cls: "bg-no-bg text-no-tx",
    icon: <path d="M6 6l12 12M18 6L6 18" />,
  },
  pending_review: {
    label: "Review",
    cls: "bg-wa-bg text-wa-tx",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2 2" />
      </>
    ),
  },
  denied: {
    label: "Denied",
    cls: "bg-no-bg text-no-tx",
    icon: <path d="M6 6l12 12M18 6L6 18" />,
  },
};

export default function StatusChip({ status }: { status: string }) {
  const s = STYLES[status] ?? {
    label: status,
    cls: "bg-soft text-muted",
    icon: <circle cx="12" cy="12" r="3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {s.icon}
      </svg>
      {s.label}
    </span>
  );
}