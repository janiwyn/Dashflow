import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { businessModules, businesses } from "@/db/schema";
import type { ModuleKey } from "@/lib/modules";

/** The modules a single business currently has active. */
export async function getActiveModuleKeys(businessId: number): Promise<Set<ModuleKey>> {
  const rows = await db
    .select({ moduleKey: businessModules.moduleKey })
    .from(businessModules)
    .where(eq(businessModules.businessId, businessId));
  return new Set(rows.map((r) => r.moduleKey as ModuleKey));
}

/** Every business with its active module set — the super-admin subscription screen. */
export async function getAllBusinessModules(): Promise<Map<number, Set<ModuleKey>>> {
  const rows = await db
    .select({ businessId: businessModules.businessId, moduleKey: businessModules.moduleKey })
    .from(businessModules);

  const map = new Map<number, Set<ModuleKey>>();
  for (const r of rows) {
    const set = map.get(r.businessId) ?? new Set<ModuleKey>();
    set.add(r.moduleKey as ModuleKey);
    map.set(r.businessId, set);
  }
  return map;
}

/**
 * Replaces a business's module set atomically-enough for this use case
 * (delete then insert — business_modules has no rows anything else depends
 * on transactionally). Called from the super-admin subscription action.
 */
export async function setBusinessModuleKeys(businessId: number, keys: ModuleKey[]) {
  await db.delete(businessModules).where(eq(businessModules.businessId, businessId));
  if (keys.length === 0) return;
  await db.insert(businessModules).values(keys.map((moduleKey) => ({ businessId, moduleKey })));
}

/**
 * Adds modules to a business's existing set — unlike setBusinessModuleKeys,
 * this never removes any. Used for self-service "add a module" from
 * /subscribe, where wiping out modules the business already pays for would
 * be a real loss of access, not just a display bug.
 */
export async function addBusinessModuleKeys(businessId: number, keys: ModuleKey[]) {
  if (keys.length === 0) return;
  await db
    .insert(businessModules)
    .values(keys.map((moduleKey) => ({ businessId, moduleKey })))
    .onConflictDoNothing();
}

/** Sanity check used by the subscription action before writing. */
export async function businessExists(businessId: number): Promise<boolean> {
  const [row] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.id, businessId)).limit(1);
  return Boolean(row);
}
