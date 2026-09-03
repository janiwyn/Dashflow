import "server-only";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { businesses, payments } from "@/db/schema";
import { addBusinessModuleKeys, setBusinessModuleKeys } from "@/db/queries/modules";
import type { ModuleKey } from "@/lib/modules";
import { PLAN_CATALOG, type PlanKey } from "@/lib/plans";
import { extendSubscriptionEnd } from "@/lib/subscription";

/**
 * Deliberately NOT in a "use server" action file: every function exported
 * from one of those becomes directly callable by any client that can guess
 * or extract its action id, with no route or auth boundary of its own. These
 * two apply the real, money-moving effect of a payment, so they're only
 * reachable from trusted server code that has already verified the payment
 * itself — src/app/actions/billing.ts's checkSubscriptionPaymentStatus
 * (which re-checks with NexumPay before calling this) and the NexumPay
 * webhook route handler (reachable only at its own URL, not as an RPC).
 */

/**
 * Applies a successful payment's effect — extends the subscription and
 * grants the plan/modules it was for. Guarded by an atomic pending->success
 * transition so it's safe to call from both the polling loop and the webhook
 * without double-extending a subscription if both see SUCCESS at once.
 */
export async function applySuccessfulPaymentByReference(reference: string, rawResponse?: unknown): Promise<void> {
  const [row] = await db
    .update(payments)
    .set({ status: "success", ...(rawResponse !== undefined ? { gatewayResponse: rawResponse } : {}) })
    .where(and(eq(payments.reference, reference), eq(payments.status, "pending")))
    .returning();
  if (!row) return;

  const [business] = await db
    .select({ subscriptionEnd: businesses.subscriptionEnd })
    .from(businesses)
    .where(eq(businesses.id, row.businessId))
    .limit(1);
  const newEnd = extendSubscriptionEnd(business?.subscriptionEnd ?? null, row.billingPeriod ?? "monthly");

  if (row.planKey) {
    await setBusinessModuleKeys(row.businessId, PLAN_CATALOG[row.planKey as PlanKey].moduleKeys);
    await db
      .update(businesses)
      .set({ planKey: row.planKey, billingPeriod: row.billingPeriod ?? "monthly", subscriptionStatus: "active", subscriptionEnd: newEnd })
      .where(eq(businesses.id, row.businessId));
  } else {
    if (row.moduleKeys?.length) await addBusinessModuleKeys(row.businessId, row.moduleKeys as ModuleKey[]);
    await db.update(businesses).set({ subscriptionStatus: "active", subscriptionEnd: newEnd }).where(eq(businesses.id, row.businessId));
  }

  revalidatePath("/dashboard");
  revalidatePath("/subscribe");
  revalidatePath("/subscription");
}

export async function markSubscriptionPaymentFailed(reference: string, rawResponse?: unknown): Promise<void> {
  await db
    .update(payments)
    .set({ status: "failed", ...(rawResponse !== undefined ? { gatewayResponse: rawResponse } : {}) })
    .where(and(eq(payments.reference, reference), eq(payments.status, "pending")));
}
