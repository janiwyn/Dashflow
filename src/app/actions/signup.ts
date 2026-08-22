"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { setBusinessModuleKeys } from "@/db/queries/modules";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";
import { isPlanKey, PLAN_CATALOG, type PlanKey } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";

import type { ActionResult } from "./users";

function subscriptionEndFor(start: Date, billingPeriod: "monthly" | "annual"): string {
  const end = new Date(start);
  if (billingPeriod === "annual") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end.toISOString().slice(0, 10);
}

/**
 * Completes a self-service signup for the "new business" path (admin or
 * manager, not staff joining an existing branch). better-auth's own
 * `signUp.email()` only creates the `user` row — `businessId`/`role` are
 * marked `input: false` in src/lib/auth.ts so a signup payload can't grant
 * itself privileges, which means nothing else about the tenant exists yet.
 * This runs right after that call succeeds (so the caller already has a
 * live session) and does the rest: creates the business, attaches it to the
 * caller, and activates whatever modules they picked at checkout.
 */
/**
 * The actual work, factored out so it can run from two different callers with
 * two different ways of identifying "who's signing up": the web app's server
 * action (cookie session via getCurrentUser()) and the mobile API route
 * (bearer token resolved to a user id before this is called).
 */
export async function completeBusinessSignup(
  userId: string,
  currentBusinessId: number | null,
  input: {
    businessName: string;
    role: "admin" | "manager";
    moduleKeys: ModuleKey[];
    planKey?: string;
    billingPeriod?: "monthly" | "annual";
  },
): Promise<ActionResult & { businessId?: number }> {
  if (currentBusinessId) return { ok: false, message: "This account already belongs to a business." };

  const name = input.businessName.trim();
  if (!name) return { ok: false, message: "Business name is required." };

  const role = input.role === "manager" ? "manager" : "admin";
  const plan: PlanKey | null = isPlanKey(input.planKey) ? input.planKey : null;
  // A package pre-selects its own module set — explicit moduleKeys only
  // matter for the à-la-carte "build your own" path with no package chosen.
  const moduleKeys = plan
    ? PLAN_CATALOG[plan].moduleKeys
    : input.moduleKeys.filter((k) => (MODULE_KEYS as readonly string[]).includes(k));
  const billingPeriod = input.billingPeriod === "annual" ? "annual" : "monthly";
  const start = new Date();

  const [business] = await db
    .insert(businesses)
    .values({
      name,
      status: "active",
      subscriptionStatus: moduleKeys.length > 0 ? "active" : "pending",
      subscriptionStart: start.toISOString().slice(0, 10),
      subscriptionEnd: moduleKeys.length > 0 ? subscriptionEndFor(start, billingPeriod) : null,
      planKey: plan,
      billingPeriod,
    })
    .returning({ id: businesses.id });

  await db.update(users).set({ businessId: business.id, role }).where(eq(users.id, userId));

  if (moduleKeys.length > 0) {
    await setBusinessModuleKeys(business.id, moduleKeys);
  }

  return { ok: true, message: "Business created.", businessId: business.id };
}

export async function finishBusinessSignup(input: {
  businessName: string;
  role: "admin" | "manager";
  moduleKeys: ModuleKey[];
  planKey?: string;
  billingPeriod?: "monthly" | "annual";
}): Promise<ActionResult & { businessId?: number }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session expired — please sign up again." };

  return completeBusinessSignup(user.id, user.businessId ?? null, input);
}
