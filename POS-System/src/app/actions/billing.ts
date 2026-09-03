"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { MODULE_KEYS, modulesMonthlyTotal, type ModuleKey } from "@/lib/modules";
import { checkTransactionStatus, nexumConfigured, requestPayment } from "@/lib/nexumpay";
import { annualPrice, PLAN_CATALOG, type PlanKey } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";
import { applySuccessfulPaymentByReference, markSubscriptionPaymentFailed } from "@/lib/subscription-payments";

type BillingPeriod = "monthly" | "annual";

export type PaymentInput =
  | { kind: "plan"; planKey: PlanKey; billingPeriod: BillingPeriod }
  | { kind: "modules"; moduleKeys: ModuleKey[] };

function priceFor(input: PaymentInput): { amount: number; narration: string } | null {
  if (input.kind === "plan") {
    const plan = PLAN_CATALOG[input.planKey];
    if (!plan || plan.monthlyPrice === null) return null;
    const amount = input.billingPeriod === "annual" ? annualPrice(plan.monthlyPrice) : plan.monthlyPrice;
    return { amount, narration: `Dashflow POS - ${plan.label} plan (${input.billingPeriod})` };
  }
  const validKeys = input.moduleKeys.filter((k) => (MODULE_KEYS as readonly string[]).includes(k));
  if (validKeys.length === 0) return null;
  return { amount: modulesMonthlyTotal(validKeys), narration: `Dashflow POS - ${validKeys.length} module${validKeys.length === 1 ? "" : "s"}` };
}

/**
 * Starts a NexumPay collection: creates a pending payment row, sends the
 * mobile-money prompt, and hands back the reference the caller polls with
 * (checkSubscriptionPaymentStatus). Doesn't wait for the customer to approve
 * the prompt — that can take anywhere from seconds to never.
 */
export async function initiateSubscriptionPayment(
  input: PaymentInput,
  phoneNumber: string,
): Promise<{ ok: true; reference: string } | { ok: false; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in first." };
  if (!user.businessId) return { ok: false, message: "Your account isn't attached to a business yet." };
  if (!nexumConfigured) return { ok: false, message: "Payments aren't set up yet — contact support." };

  const phone = phoneNumber.trim();
  if (!phone) return { ok: false, message: "Enter a phone number to pay with." };

  const priced = priceFor(input);
  if (!priced) return { ok: false, message: "That can't be charged automatically — contact us instead." };

  const reference = `SUB-${user.businessId}-${Date.now()}`;

  await db.insert(payments).values({
    businessId: user.businessId,
    reference,
    planKey: input.kind === "plan" ? input.planKey : null,
    billingPeriod: input.kind === "plan" ? input.billingPeriod : null,
    moduleKeys: input.kind === "modules" ? input.moduleKeys : null,
    amount: priced.amount,
    phone,
    narration: priced.narration,
  });

  const callbackUrl = process.env.BETTER_AUTH_URL ? `${process.env.BETTER_AUTH_URL}/api/webhooks/nexumpay` : undefined;

  const result = await requestPayment({
    phoneNumber: phone,
    amount: priced.amount,
    narration: priced.narration,
    reference,
    callbackUrl,
  });

  if (!result.ok) {
    await db
      .update(payments)
      .set({ status: "failed", gatewayResponse: { error: result.error } })
      .where(eq(payments.reference, reference));
    return { ok: false, message: result.error };
  }

  return { ok: true, reference };
}

/**
 * Polled by the client every few seconds after initiateSubscriptionPayment
 * while it waits for the customer to approve the phone prompt. Re-checks
 * with NexumPay itself before ever marking a payment successful — a client
 * can call this with any reference, but it only has an effect on a payment
 * row that (a) belongs to the caller's own business and (b) NexumPay itself
 * confirms as paid.
 */
export async function checkSubscriptionPaymentStatus(
  reference: string,
): Promise<{ status: "pending" | "success" | "failed"; message: string }> {
  const user = await getCurrentUser();
  if (!user?.businessId) return { status: "failed", message: "Not signed in." };

  const [row] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.reference, reference), eq(payments.businessId, user.businessId)))
    .limit(1);
  if (!row) return { status: "failed", message: "Payment not found." };
  // The webhook may have already resolved this — no need to hit NexumPay again.
  if (row.status !== "pending") {
    return { status: row.status, message: row.status === "success" ? "Payment confirmed." : "Payment failed." };
  }

  const check = await checkTransactionStatus(reference);
  if (!check.ok) return { status: "pending", message: check.error };

  if (check.status === "SUCCESS") {
    await applySuccessfulPaymentByReference(reference, check.raw);
    return { status: "success", message: "Payment confirmed." };
  }
  if (check.status === "FAILED") {
    await markSubscriptionPaymentFailed(reference, check.raw);
    return { status: "failed", message: "Payment failed or was declined." };
  }
  return { status: "pending", message: "Waiting for you to approve the prompt on your phone." };
}
