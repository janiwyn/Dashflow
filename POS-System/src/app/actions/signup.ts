"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { setBusinessModuleKeys } from "@/db/queries/modules";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";
import { getCurrentUser } from "@/lib/session";

import type { ActionResult } from "./users";

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
export async function finishBusinessSignup(input: {
  businessName: string;
  role: "admin" | "manager";
  moduleKeys: ModuleKey[];
}): Promise<ActionResult & { businessId?: number }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session expired — please sign up again." };
  if (user.businessId) return { ok: false, message: "This account already belongs to a business." };

  const name = input.businessName.trim();
  if (!name) return { ok: false, message: "Business name is required." };

  const role = input.role === "manager" ? "manager" : "admin";
  const moduleKeys = input.moduleKeys.filter((k) => (MODULE_KEYS as readonly string[]).includes(k));

  const [business] = await db
    .insert(businesses)
    .values({
      name,
      status: "active",
      subscriptionStatus: moduleKeys.length > 0 ? "active" : "pending",
      subscriptionStart: new Date().toISOString().slice(0, 10),
    })
    .returning({ id: businesses.id });

  await db.update(users).set({ businessId: business.id, role }).where(eq(users.id, user.id));

  if (moduleKeys.length > 0) {
    await setBusinessModuleKeys(business.id, moduleKeys);
  }

  return { ok: true, message: "Business created.", businessId: business.id };
}
