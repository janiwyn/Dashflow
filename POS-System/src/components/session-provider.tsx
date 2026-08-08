"use client";

import { createContext, useContext, type ReactNode } from "react";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  branch: string | null;
  branchId: number | null;
  initials: string;
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
