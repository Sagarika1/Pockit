"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { primaryBtn } from "@/components/ui";
import { useMe } from "@/components/useMe";

/** Shows its children only to visitors who are not logged in (sign-up and log-in prompts). */
export function LoggedOutOnly({ children }: { children: ReactNode }) {
  const { me, loading } = useMe();
  if (loading || me?.user) return null;
  return <>{children}</>;
}

/** The opposite: a button back to their own page for people who are already logged in. */
export function LoggedInOnly() {
  const { me, loading } = useMe();
  if (loading || !me?.user) return null;
  return (
    <Link href={me.user.role === "treasurer" ? "/treasurer" : "/submit"} className={primaryBtn}>
      Go to your page
    </Link>
  );
}
