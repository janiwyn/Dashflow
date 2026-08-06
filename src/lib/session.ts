import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth, type SessionUser } from "./auth";

/**
 * Cached per request so several server components can call it without
 * re-hitting the session store.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/** Use in any server component that must not render for signed-out visitors. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: string[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role ?? "staff")) redirect("/");
  return user;
}

/**
 * Every tenant-scoped query needs a business id. Users created before being
 * assigned to a business fall back to the demo business seeded by db:seed.
 */
export async function getActiveBusinessId(): Promise<number> {
  const user = await getCurrentUser();
  return user?.businessId ?? 1;
}
