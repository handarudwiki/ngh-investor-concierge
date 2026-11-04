"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { getState, useStore } from "@/lib/store";
import { currentUser, useCan, type Permission } from "@/lib/permissions";

/** Workspace gate: signed-out visitors go to /login and come back afterwards. */
export function RequireUser({ children }: { children: ReactNode }) {
  const signedIn = useStore((s) => Boolean(currentUser(s)));
  const router = useRouter();

  useEffect(() => {
    // Read the live store, not the render value: the first render during
    // hydration uses the server snapshot, which is always signed out.
    if (currentUser(getState())) return;
    const next = window.location.pathname + window.location.search;
    router.replace(next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
  }, [signedIn, router]);

  if (!signedIn) return <div className="h-dvh bg-canvas" />;
  return children;
}

/** Page-level role check (NFR security: role-based access). */
export function Restricted({ permission, children }: { permission: Permission; children: ReactNode }) {
  const allowed = useCan(permission);
  if (allowed) return children;
  return (
    <EmptyState
      icon={Lock}
      title="Admins only"
      description="Your role doesn't include this page. Ask an NGH admin if you need access."
      className="flex-1"
    />
  );
}

/** Banner for pages advisors can read but not change. */
export function ReadOnlyNotice({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2 rounded-sm border border-line bg-subtle px-3 py-2 text-xs text-ink-muted">
      <Lock className="size-3.5 shrink-0" /> {children}
    </p>
  );
}
