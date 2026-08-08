"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { cashBookEntries, ledgerAccounts, transactions } from "@/db/schema";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

export type LedgerAccountType = "asset" | "liability" | "equity" | "income" | "expense";

export async function createLedgerAccount(input: {
  name: string;
  type: LedgerAccountType;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Account name is required." };

  const [existing] = await db
    .select({ id: ledgerAccounts.id })
    .from(ledgerAccounts)
    .where(and(eq(ledgerAccounts.businessId, businessId), eq(ledgerAccounts.name, input.name.trim())))
    .limit(1);
  if (existing) return { ok: false, message: "Account already exists!" };

  await db
    .insert(ledgerAccounts)
    .values({ businessId, name: input.name.trim(), type: input.type });

  revalidatePath("/add-account");
  revalidatePath("/ledger");
  revalidatePath("/trial-balance");
  return { ok: true, message: "Account added successfully!" };
}

export async function createTransaction(input: {
  type: "income" | "expense";
  description: string;
  amount: number;
  entryDate: string;
  branchId?: number | null;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.description.trim()) return { ok: false, message: "Description is required." };
  if (!(input.amount > 0)) return { ok: false, message: "Amount must be greater than 0." };

  await db.insert(transactions).values({
    businessId,
    branchId: input.branchId ?? actor.branchId ?? null,
    entryDate: input.entryDate,
    type: input.type,
    description: input.description.trim(),
    amount: input.amount,
    handledById: actor.id,
    handledByName: actor.name,
  });

  revalidatePath("/add-transaction");
  revalidatePath("/accounting");
  return { ok: true, message: "Transaction recorded." };
}

export async function createCashBookEntry(input: {
  entryDate: string;
  particulars: string;
  cashIn: number;
  bankIn: number;
  cashOut: number;
  bankOut: number;
  source?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.particulars.trim()) return { ok: false, message: "Particulars are required." };

  await db.insert(cashBookEntries).values({
    businessId,
    entryDate: input.entryDate,
    particulars: input.particulars.trim(),
    cashIn: input.cashIn,
    bankIn: input.bankIn,
    cashOut: input.cashOut,
    bankOut: input.bankOut,
    source: input.source ?? "Manual Entry",
  });

  revalidatePath("/add-cash-entry");
  revalidatePath("/cash-book");
  return { ok: true, message: "Cash book entry added." };
}
