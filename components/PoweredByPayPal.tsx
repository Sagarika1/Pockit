/* eslint-disable @next/next/no-img-element */
// Uses the two logo files in /public. The color one is a tightly cropped copy, so the sizes below
// are the real, visible height of the logo.
export default function PoweredByPayPal({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const logoHeight = compact ? "h-[26px]" : "h-[32px]";
  return (
    <div className={`flex items-center gap-2 text-muted ${compact ? "text-[13px]" : "text-sm"} ${className}`}>
      <span>Powered by</span>
      <img src="/paypal-logo-color.png" alt="PayPal" className={`${logoHeight} w-auto dark:hidden`} />
      <img src="/paypal-logo-white.png" alt="PayPal" className={`hidden ${logoHeight} w-auto dark:block`} />
    </div>
  );
}
