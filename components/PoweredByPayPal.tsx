/* eslint-disable @next/next/no-img-element */
export default function PoweredByPayPal({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const logoHeight = compact ? "h-[14px]" : "h-[18px]";
  return (
    <div
      className={`flex items-center gap-1.5 text-muted ${compact ? "text-[12px]" : "text-[13px]"} ${className}`}
    >
      <span>Powered by</span>
      <img src="/paypal-logo-color.png" alt="PayPal" className={`${logoHeight} w-auto dark:hidden`} />
      <img src="/paypal-logo-white.png" alt="PayPal" className={`hidden ${logoHeight} w-auto dark:block`} />
    </div>
  );
}