import PoweredByPayPal from "@/components/PoweredByPayPal";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <PoweredByPayPal />
        <p className="text-[13px] text-muted">
          Hackathon demo. Payments run in the PayPal sandbox with test accounts. Every request and decision is saved so you can look back.
        </p>
      </div>
    </footer>
  );
}