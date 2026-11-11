"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "/", label: "Submit a receipt" },
  { href: "/treasurer", label: "Treasurer" },
];

function NavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={`items-center gap-1 ${className}`}>
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
              active ? "bg-soft text-brand" : "text-muted hover:text-ink hover:bg-soft"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="Pockit home">
            <Logo />
          </Link>
          <NavLinks className="hidden sm:flex" />
        </div>
        <ThemeToggle />
      </div>
      <div className="border-t border-line px-4 py-2 sm:hidden">
        <NavLinks className="flex justify-center" />
      </div>
    </header>
  );
}