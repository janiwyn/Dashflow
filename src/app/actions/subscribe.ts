"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { addBusinessModuleKeys, setBusinessModuleKeys } from "@/db/queries/modules";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";
import { PLAN_CATALOG, type PlanKey } from "@/lib/plans";
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

/**
 * Switches the caller's business onto a packaged plan — replaces whatever
 * module set it had with the plan's own set (a package is meant to fully
 * define the business's modules, not layer on top of an existing custom
 * mix) and records the plan/billing choice for the usage limits and the
 * super-admin subscriptions screen to read.
 */
export async function subscribeToPlan(planKey: PlanKey, billingPeriod: "monthly" | "annual"): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in first." };
  if (!user.businessId) return { ok: false, message: "Your account isn't attached to a business yet." };

  const plan = PLAN_CATALOG[planKey];
  if (!plan) return { ok: false, message: "Unknown plan." };

  await setBusinessModuleKeys(user.businessId, plan.moduleKeys);
  await db
    .update(businesses)
    .set({ planKey, billingPeriod, subscriptionStatus: "active" })
    .where(eq(businesses.id, user.businessId));

  return { ok: true, message: `Switched to the ${plan.label} plan.` };
}
