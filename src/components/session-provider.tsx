"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { PlanKey } from "@/lib/plans";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  branch: string | null;
  branchId: number | null;
  initials: string;
  /** Whether the business has more than one branch — hides multi-branch nav (branch monitoring, per-branch manager views) for single-branch shops, since a "manage all branches" screen showing just the one they're already in is clutter, not a feature. */
  hasMultipleBranches: boolean;
  /** The business's packaged plan, or null if it was built à la carte from individual modules — tier gating (e.g. Remote Orders needing Retail+) only applies when this is set. */
  planKey: PlanKey | null;
};

const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

/**
 * The dashboard layout guarantees a user, so this never returns null inside
 * AppShell. Components rendered outside the layout should use `useOptionalUser`.
 */
export function useSessionUser(): SessionUser {
  const user = useContext(SessionContext);
  if (!user) {
    throw new Error("useSessionUser must be used inside the authenticated layout");
  }
  return user;
}

export function useOptionalUser(): SessionUser | null {
  return useContext(SessionContext);
}
