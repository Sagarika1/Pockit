"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type Membership = {
  id: string;
  orgId: string;
  orgName: string;
  kind: "student" | "employee" | "volunteer";
  status: "pending" | "approved" | "denied" | "removed";
};

export type Me = {
  user: { id: string; role: "treasurer" | "member"; name: string; email: string; phone?: string; paypalEmail?: string } | null;
  org?: { id: string; name: string; type: string };
  memberships?: Membership[];
  demo?: boolean; // logged out and the demo accounts are on
  demoReader?: boolean; // true when there is no Anthropic key (demo mode)
};

/** Who is logged in right now (asks the server). */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      setMe((await res.json()) as Me);
    } catch {
      setMe({ user: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { me, loading, refresh };
}

/** For pages that need a login. Sends people to the right place if they shouldn't be here. */
export function useRequireRole(role: "treasurer" | "member") {
  const router = useRouter();
  const { me, loading, refresh } = useMe();
  const user = me?.user ?? null;

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(user.role === "treasurer" ? "/treasurer" : "/submit");
  }, [loading, user, role, router]);

  return { me, refresh, ready: !loading && user?.role === role };
}
