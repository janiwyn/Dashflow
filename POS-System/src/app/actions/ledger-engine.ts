import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { cashBookEntries, ledgerAccounts, ledgerEntries, transactions } from "@/db/schema";

/**
 * Auto-posts the accounting side-effects of real business events — a sale,
 * an expense — so a business using Accounting never has to learn
 * double-entry bookkeeping to see a correct ledger, trial balance, balance
 * sheet or cash book. Nothing here is called directly from the client; it's
 * invoked by the actions that record the underlying event (checkoutSale,
 * completeRemoteOrder, createExpense).
 *
 * The chart of accounts grows lazily — an account is created the first time
 * something actually needs it, not provisioned up front. A business that's
 * never made a sale or logged an expense has an empty ledger, which is the
 * correct state to show, not a bug to work around.
 */

type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

async function resolveAccount(businessId: number, name: string, type: AccountType): Promise<number> {
  const [existing] = await db
    .select({ id: ledgerAccounts.id })
    .from(ledgerAccounts)
    .where(and(eq(ledgerAccounts.businessId, businessId), eq(ledgerAccounts.name, name)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(ledgerAccounts)
    .values({ businessId, name, type })
    .returning({ id: ledgerAccounts.id });
  return created.id;
}

const toDateString = (d: Date) => d.toISOString().slice(0, 10);

/** Records a completed sale — till checkout or a fulfilled remote order. */
export async function recordSaleAccounting(params: {
  businessId: number;
  branchId: number | null;
  reference: string;
  amount: number;
  method: "cash" | "mpesa" | "card" | "invoice" | "bank";
  handledById: string;
  handledByName: string;
  date: Date;
}) {
  if (params.amount <= 0) return;
  const entryDate = toDateString(params.date);
  const description = `Sale ${params.reference}`;

  const [cashAccountId, revenueAccountId] = await Promise.all([
    resolveAccount(params.businessId, "Cash in Hand", "asset"),
    resolveAccount(params.businessId, "Sales Revenue", "income"),
  ]);

  await db.insert(ledgerEntries).values([
    { accountId: cashAccountId, entryDate, description, debit: params.amount, credit: 0 },
    { accountId: revenueAccountId, entryDate, description, debit: 0, credit: params.amount },
  ]);

  await db.insert(transactions).values({
    businessId: params.businessId,
    branchId: params.branchId,
    entryDate,
    type: "income",
    description,
    amount: params.amount,
    handledById: params.handledById,
    handledByName: params.handledByName,
  });

  // Cash lands in the till; card/mobile money/bank settle into a bank-like
  // balance instead — the cash book's own split, kept meaningful.
  const isCash = params.method === "cash";
  await db.insert(cashBookEntries).values({
    businessId: params.businessId,
    entryDate,
    particulars: description,
    cashIn: isCash ? params.amount : 0,
    bankIn: isCash ? 0 : params.amount,
    cashOut: 0,
    bankOut: 0,
    source: "Sales",
  });
}

/** Records a logged expense. */
export async function recordExpenseAccounting(params: {
  businessId: number;
  branchId: number | null;
  category: string;
  label: string;
  amount: number;
  handledById: string;
  handledByName: string;
  date: string;
}) {
  if (params.amount <= 0) return;

  const category = params.category.trim() || "General";
  const expenseAccountName = category.toLowerCase().endsWith("expense") ? category : `${category} Expense`;

  const [expenseAccountId, cashAccountId] = await Promise.all([
    resolveAccount(params.businessId, expenseAccountName, "expense"),
    resolveAccount(params.businessId, "Cash in Hand", "asset"),
  ]);

  await db.insert(ledgerEntries).values([
    { accountId: expenseAccountId, entryDate: params.date, description: params.label, debit: params.amount, credit: 0 },
    { accountId: cashAccountId, entryDate: params.date, description: params.label, debit: 0, credit: params.amount },
  ]);

  await db.insert(transactions).values({
    businessId: params.businessId,
    branchId: params.branchId,
    entryDate: params.date,
    type: "expense",
    description: params.label,
    amount: params.amount,
    handledById: params.handledById,
    handledByName: params.handledByName,
  });

  await db.insert(cashBookEntries).values({
    businessId: params.businessId,
    entryDate: params.date,
    particulars: params.label,
    cashIn: 0,
    bankIn: 0,
    cashOut: params.amount,
    bankOut: 0,
    source: "Expenses",
  });
}
