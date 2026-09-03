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

/**
 * The session cookie caches the user object for up to 5 minutes
 * (session.cookieCache in src/lib/auth.ts) — fine for things like a display
 * name, but a real problem for a field that gates access (mustChangePassword,
 * business subscription state): a server action can update the database and
 * still have the very next page load read the stale cached value, since
 * Server Actions run in a separate request from whatever reads the session
 * next. Call this at the end of any action that changes such a field, from
 * within the same action (Server Actions, unlike plain Server Components,
 * are allowed to set cookies) — it re-reads from the database and rewrites
 * the cookie cache with the fresh value immediately.
 */
export async function refreshSessionCookie(): Promise<void> {
  await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
}

/** Use in any server component that must not render for signed-out visitors. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: string[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role ?? "staff")) redirect("/dashboard");
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

/**
 * Roles that can see every branch within their business. Everyone else
 * (manager, staff) is locked to the single branch they're assigned to.
 */
const BUSINESS_WIDE_ROLES = new Set(["super", "admin"]);

/**
 * Returns the branch id a query must be restricted to, or `undefined` when
 * the signed-in user is allowed to see every branch in the business.
 *
 * Query functions should treat `undefined` as "no branch filter" and a
 * number as a hard filter that overrides any branchId the caller passed in
 * — a manager or staff member can never widen their own view.
 */
export async function getActiveBranchScope(): Promise<number | undefined> {
  const user = await getCurrentUser();
  if (!user) return undefined;
  if (BUSINESS_WIDE_ROLES.has(user.role ?? "staff")) return undefined;
  return user.branchId ?? undefined;
}
