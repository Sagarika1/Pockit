import PoweredByPayPal from "@/components/PoweredByPayPal";

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center shrink-0">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-on-brand"
          aria-hidden="true"
        >
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[26px] font-bold tracking-tight text-ink">Pockit</span>
        <PoweredByPayPal compact className="mt-1" />
      </div>
    </div>
  );
}