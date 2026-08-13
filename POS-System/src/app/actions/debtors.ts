"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { debtorPayments, debtors } from "@/db/schema";
import { enforcedBranchId } from "@/db/queries/_helpers";
import { getDebtorPayments } from "@/db/queries/operations";
import { requireRole, requireUser } from "@/lib/session";

import type { ActionResult } from "./users";

function revalidateDebtors() {
  revalidatePath("/debtor-payment");
}

/** Read-only wrapper so the client can fetch one debtor's payment history on demand. */
export async function fetchDebtorPayments(debtorId: number) {
  await requireUser();
  return getDebtorPayments(debtorId);
}

export async function createDebtor(input: {
  name: string;
  phone: string;
  itemTaken: string;
  quantity: number;
  amountPaid: number;
  balance: number;
  branchId: number | null;
  dueDate?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Debtor name is required." };
  if (input.balance < 0) return { ok: false, message: "Balance can't be negative." };

  const branchId = await enforcedBranchId(input.branchId ?? undefined);

  await db.insert(debtors).values({
    businessId,
    branchId: branchId ?? null,
    name: input.name.trim(),
    phone: input.phone.trim() || null,
    itemTaken: input.itemTaken.trim() || null,
    quantity: input.quantity,
    amountPaid: input.amountPaid,
    balance: input.balance,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
  });

  revalidateDebtors();
  return { ok: true, message: `${input.name.trim()} added.` };
}

/** Records a real repayment: writes a ledger row and reconciles the debtor's running balance/amount paid. */
export async function recordDebtorPayment(input: { debtorId: number; amount: number }): Promise<ActionResult & { newBalance?: number }> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.amount || input.amount <= 0) return { ok: false, message: "Enter a valid amount." };

  const [debtor] = await db
    .select()
    .from(debtors)
    .where(and(eq(debtors.id, input.debtorId), eq(debtors.businessId, businessId)))
    .limit(1);
  if (!debtor) return { ok: false, message: "Debtor not found." };

  const currentBalance = Number(debtor.balance);
  if (input.amount > currentBalance) {
    return { ok: false, message: "That's more than the outstanding balance — enter an amount up to what's owed." };
  }

  const newBalance = Math.max(currentBalance - input.amount, 0);

  await db.insert(debtorPayments).values({
    debtorId: debtor.id,
    amount: input.amount,
    balanceAfter: newBalance,
    recordedById: actor.id,
  });

  await db
    .update(debtors)
    .set({ balance: newBalance, amountPaid: sql`${debtors.amountPaid} + ${input.amount}` })
    .where(eq(debtors.id, debtor.id));

  revalidateDebtors();
  return {
    ok: true,
    message: newBalance === 0 ? "Debt fully paid off." : "Payment recorded.",
    newBalance,
  };
}

export async function deleteDebtor(id: number): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");
  const businessId = actor.businessId ?? 1;

  const [deleted] = await db
    .delete(debtors)
    .where(and(eq(debtors.id, id), eq(debtors.businessId, businessId)))
    .returning({ id: debtors.id });
  if (!deleted) return { ok: false, message: "Debtor not found." };

  revalidateDebtors();
  return { ok: true, message: "Debtor record removed." };
}
