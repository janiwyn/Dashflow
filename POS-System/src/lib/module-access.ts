import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getActiveModuleKeys } from "@/db/queries/modules";
import { getActiveBusinessId, requireUser } from "@/lib/session";
import type { ModuleKey } from "@/lib/modules";
import type { SessionUser } from "@/lib/auth";

/**
 * Cached per request — several components (layout, sidebar, page) can ask
 * without re-hitting the database. The super admin isn't tied to a business,
 * so their "active modules" is the empty set; callers that care (requireModule)
 * special-case the super role instead of relying on this returning everything.
 */
export const getSessionModules = cache(async (): Promise<Set<ModuleKey>> => {
  const businessId = await getActiveBusinessId();
  return getActiveModuleKeys(businessId);
});

export async function hasModule(key: ModuleKey): Promise<boolean> {
  const active = await getSessionModules();
  return active.has(key);
}

/**
 * Guards a module's pages. The super admin operates the platform rather than
 * a single tenant, so they can always reach a module's screens (there's
 * nothing to gate them against). Everyone else is redirected to /dashboard
 * if their business hasn't subscribed to any of the given modules.
 */
export async function requireModule(...keys: ModuleKey[]): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "super") return user;

  const active = await getSessionModules();
  if (!keys.some((k) => active.has(k))) redirect("/dashboard");
  return user;
}
