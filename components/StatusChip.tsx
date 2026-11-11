const NOT_APPROVED = { label: "Not approved", cls: "bg-no-bg text-no-tx", icon: <path d="M6 6l12 12M18 6L6 18" /> };

const STYLES: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  paid: { label: "Paid", cls: "bg-ok-bg text-ok-tx", icon: <path d="M5 12l4 4 10-10" /> },
  rejected: NOT_APPROVED,
  denied: NOT_APPROVED,
  payout_failed: { label: "Payment failed", cls: "bg-no-bg text-no-tx", icon: <path d="M12 7v6M12 17h.01" /> },
  pending_review: {
    label: "Waiting on treasurer",
    cls: "bg-wa-bg text-wa-tx",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2 2" />
      </>
    ),
  },
};

export default function StatusChip({ status }: { status: string }) {
  const s = STYLES[status] ?? { label: status, cls: "bg-soft text-muted", icon: <circle cx="12" cy="12" r="3" /> };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {s.icon}
      </svg>
      {s.label}
    </span>
  );
}
