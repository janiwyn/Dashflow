"use server";

import { addBusinessModuleKeys } from "@/db/queries/modules";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";
import { getCurrentUser } from "@/lib/session";

import type { ActionResult } from "./users";

/**
 * Self-service "add a module" for a signed-in admin/manager — the
 * /subscribe checkout for someone who already has an account and business,
 * as opposed to finishBusinessSignup() which creates one from scratch.
 * Adds to whatever the business already has active; never removes any.
 */
export async function addModulesToMyBusiness(moduleKeys: ModuleKey[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in first." };
  if (!user.businessId) return { ok: false, message: "Your account isn't attached to a business yet." };

  const validKeys = moduleKeys.filter((k) => (MODULE_KEYS as readonly string[]).includes(k));
  if (validKeys.length === 0) return { ok: false, message: "Choose at least one module." };

  await addBusinessModuleKeys(user.businessId, validKeys);

  return { ok: true, message: "Modules added to your account." };
}
