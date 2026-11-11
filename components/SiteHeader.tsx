"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useMe } from "@/components/useMe";

type NavItem = { href: string; label: string; exact?: boolean };

function itemsFor(role: "treasurer" | "member" | null): NavItem[] {
  if (role === "treasurer")
    return [
      { href: "/treasurer", label: "Overview", exact: true },
      { href: "/treasurer/people", label: "People" },
      { href: "/treasurer/rules", label: "Rules" },
    ];
  if (role === "member") return [{ href: "/submit", label: "Submit a receipt" }];
  return [
    { href: "/#who", label: "Who it’s for" },
    { href: "/#how", label: "How it works" },
  ];
}

function NavLinks({ items, className = "" }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={`items-center gap-1 ${className}`}>
      {items.map((l) => {
        const active = !l.href.includes("#") && (l.exact ? pathname === l.href : pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
              active ? "bg-soft text-brand" : "text-muted hover:bg-soft hover:text-ink"
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
  const pathname = usePathname();
  const router = useRouter();
  const { me, loading, refresh } = useMe();

  // Check who's logged in again whenever the page changes (after logging in or out)
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  const user = me?.user ?? null;
  const items = loading ? [] : itemsFor(user?.role ?? null);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <div className="mx-auto flex h-[80px] max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Pockit home">
            <Logo />
          </Link>
          <NavLinks items={items} className="hidden md:flex" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {!loading && !user && (
            <>
              <Link href="/login" className="hidden rounded-full px-4 py-2 text-[15px] font-semibold text-ink hover:bg-soft sm:inline-block">
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-[15px] font-semibold text-on-brand hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
          {!loading && user && (
            <>
              <span className="hidden max-w-[200px] truncate text-sm text-muted lg:inline">
                {user.role === "treasurer" && me?.org ? me.org.name : user.name}
              </span>
              <button
                onClick={logout}
                className="inline-flex h-11 items-center rounded-full border border-line px-5 text-[15px] font-semibold text-ink hover:bg-soft"
              >
                Log out
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
      {items.length > 0 && (
        <div className="flex items-center justify-center gap-1 border-t border-line px-4 py-2 md:hidden">
          <NavLinks items={items} className="flex" />
          {!user && (
            <Link href="/login" className="rounded-full px-4 py-2 text-[15px] font-semibold text-ink hover:bg-soft sm:hidden">
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
