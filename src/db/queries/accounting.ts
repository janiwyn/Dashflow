import "server-only";

import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  branches,
  cashBookEntries,
  expenses,
  ledgerAccounts,
  ledgerEntries,
  pettyCashActions,
  pettyCashTransactions,
  products,
  sales,
  transactions,
  users,
} from "@/db/schema";

import { businessScope, enforcedBranchId, num } from "./_helpers";

export async function getLedgerAccounts() {
  const businessId = await businessScope();
  return db
    .select({
      id: ledgerAccounts.id,
      name: ledgerAccounts.name,
      type: ledgerAccounts.type,
      openingBalance: ledgerAccounts.openingBalance,
    })
    .from(ledgerAccounts)
    .where(eq(ledgerAccounts.businessId, businessId))
    .orderBy(asc(ledgerAccounts.id));
}

export async function getLedgerEntries(accountId: number) {
  const rows = await db
    .select({
      id: ledgerEntries.id,
      date: ledgerEntries.entryDate,
      description: ledgerEntries.description,
      debit: ledgerEntries.debit,
      credit: ledgerEntries.credit,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.accountId, accountId))
    .orderBy(asc(ledgerEntries.entryDate), asc(ledgerEntries.id));

  return rows.map((r) => ({ ...r, debit: num(r.debit), credit: num(r.credit) }));
}

/** Debit/credit totals per account — the trial balance. */
export async function getTrialBalance() {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: ledgerAccounts.id,
      name: ledgerAccounts.name,
      type: ledgerAccounts.type,
      debit: sql<number>`coalesce(sum(${ledgerEntries.debit}), 0)`,
      credit: sql<number>`coalesce(sum(${ledgerEntries.credit}), 0)`,
    })
    .from(ledgerAccounts)
    .leftJoin(ledgerEntries, eq(ledgerEntries.accountId, ledgerAccounts.id))
    .where(eq(ledgerAccounts.businessId, businessId))
    .groupBy(ledgerAccounts.id, ledgerAccounts.name, ledgerAccounts.type)
    .orderBy(asc(ledgerAccounts.id));

  const accounts = rows.map((r) => ({ ...r, debit: num(r.debit), credit: num(r.credit) }));
  return {
    accounts,
    totalDebit: accounts.reduce((s, a) => s + a.debit, 0),
    totalCredit: accounts.reduce((s, a) => s + a.credit, 0),
  };
}

export async function getTransactions(limit = 50) {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.entryDate,
      type: transactions.type,
      description: transactions.description,
      branch: branches.name,
      amount: transactions.amount,
      handledBy: transactions.handledByName,
    })
    .from(transactions)
    .leftJoin(branches, eq(transactions.branchId, branches.id))
    .where(eq(transactions.businessId, businessId))
    .orderBy(desc(transactions.entryDate), desc(transactions.id))
    .limit(limit);

  // Expenses render as negative in the feed; the column itself stays positive.
  return rows.map((r) => ({
    ...r,
    amount: r.type === "expense" ? -num(r.amount) : num(r.amount),
  }));
}

export async function getExpenses(options?: { limit?: number; branchId?: number; from?: string; to?: string }) {
  const businessId = await businessScope();
  const branchId = await enforcedBranchId(options?.branchId);

  const filters = [eq(expenses.businessId, businessId)];
  if (branchId) filters.push(eq(expenses.branchId, branchId));
  if (options?.from) filters.push(gte(expenses.incurredOn, options.from));
  if (options?.to) filters.push(lte(expenses.incurredOn, options.to));

  const rows = await db
    .select({
      id: expenses.id,
      ref: expenses.reference,
      label: expenses.label,
      category: expenses.category,
      amount: expenses.amount,
      date: expenses.incurredOn,
      branch: branches.name,
      spentBy: users.name,
    })
    .from(expenses)
    .leftJoin(branches, eq(expenses.branchId, branches.id))
    .leftJoin(users, eq(expenses.handledById, users.id))
    .where(and(...filters))
    .orderBy(desc(expenses.incurredOn), desc(expenses.id))
    .limit(options?.limit ?? 50);

  return rows.map((r) => ({ ...r, amount: num(r.amount) }));
}

export async function getCashBook() {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: cashBookEntries.id,
      date: cashBookEntries.entryDate,
      particulars: cashBookEntries.particulars,
      cashIn: cashBookEntries.cashIn,
      bankIn: cashBookEntries.bankIn,
      cashOut: cashBookEntries.cashOut,
      bankOut: cashBookEntries.bankOut,
      source: cashBookEntries.source,
    })
    .from(cashBookEntries)
    .where(eq(cashBookEntries.businessId, businessId))
    .orderBy(asc(cashBookEntries.entryDate), asc(cashBookEntries.id));

  return rows.map((r) => ({
    ...r,
    cashIn: num(r.cashIn),
    bankIn: num(r.bankIn),
    cashOut: num(r.cashOut),
    bankOut: num(r.bankOut),
  }));
}

export async function getPettyCash() {
  const businessId = await businessScope();

  const actions = await db
    .select({
      id: pettyCashActions.id,
      date: pettyCashActions.actedAt,
      action: pettyCashActions.action,
      amount: pettyCashActions.amount,
      approvedBy: pettyCashActions.approvedByName,
    })
    .from(pettyCashActions)
    .where(eq(pettyCashActions.businessId, businessId))
    .orderBy(desc(pettyCashActions.actedAt));

  const spend = await db
    .select({
      id: pettyCashTransactions.id,
      date: pettyCashTransactions.entryDate,
      name: pettyCashTransactions.name,
      branch: branches.name,
      purpose: pettyCashTransactions.purpose,
      reason: pettyCashTransactions.reason,
      amount: pettyCashTransactions.amount,
      balance: pettyCashTransactions.balance,
      approvedBy: pettyCashTransactions.approvedByName,
    })
    .from(pettyCashTransactions)
    .leftJoin(branches, eq(pettyCashTransactions.branchId, branches.id))
    .where(eq(pettyCashTransactions.businessId, businessId))
    .orderBy(desc(pettyCashTransactions.entryDate), desc(pettyCashTransactions.id));

  const float = actions.reduce(
    (sum, a) => sum + (a.action === "add" ? num(a.amount) : -num(a.amount)),
    0,
  );
  const spent = spend.reduce((sum, s) => sum + num(s.amount), 0);

  return {
    actions: actions.map((a) => ({ ...a, amount: num(a.amount) })),
    transactions: spend.map((s) => ({ ...s, amount: num(s.amount), balance: num(s.balance) })),
    float,
    spent,
    balance: float - spent,
  };
}

/** Revenue, cost of sales and expenses over a window. */
export async function getIncomeStatement(days = 30) {
  const businessId = await businessScope();

  const [revenueRow] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
      refunds: sql<number>`coalesce(sum(${sales.total}) filter (where ${sales.status} = 'refunded'), 0)`,
    })
    .from(sales)
    .where(
      and(eq(sales.businessId, businessId), sql`${sales.soldAt} >= current_date - ${days}::int`),
    );

  const expenseRows = await db
    .select({
      category: expenses.category,
      amount: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.businessId, businessId),
        sql`${expenses.incurredOn} >= current_date - ${days}::int`,
      ),
    )
    .groupBy(expenses.category)
    .orderBy(desc(sql`coalesce(sum(${expenses.amount}), 0)`));

  const revenue = num(revenueRow?.revenue) - num(revenueRow?.refunds);
  const categorised = expenseRows.map((e) => ({ ...e, amount: num(e.amount) }));
  const totalExpenses = categorised.reduce((s, e) => s + e.amount, 0);

  // Cost of sales approximated from the buying price of what was sold.
  const [costRow] = await db
    .select({
      cost: sql<number>`coalesce(sum(${products.buyingPrice} * si.quantity), 0)`,
    })
    .from(sql`sale_items si`)
    .innerJoin(sales, sql`si.sale_id = ${sales.id}`)
    .leftJoin(products, sql`si.product_id = ${products.id}`)
    .where(
      and(
        eq(sales.businessId, businessId),
        sql`${sales.soldAt} >= current_date - ${days}::int`,
        sql`${sales.status} <> 'refunded'`,
      ),
    );

  const costOfSales = num(costRow?.cost);
  const grossProfit = revenue - costOfSales;

  return {
    revenue,
    costOfSales,
    grossProfit,
    expenses: categorised,
    totalExpenses,
    netProfit: grossProfit - totalExpenses,
  };
}

/**
 * Assets / liabilities / equity rolled up from the chart of accounts.
 * Each balance is the account's opening balance plus its net movement.
 */
export async function getBalanceSheet() {
  const businessId = await businessScope();
  const balances = await db
    .select({
      id: ledgerAccounts.id,
      name: ledgerAccounts.name,
      type: ledgerAccounts.type,
      balance: sql<number>`${ledgerAccounts}.opening_balance
        + coalesce((select sum(${ledgerEntries}.debit) from ${ledgerEntries} where ${ledgerEntries}.account_id = ${ledgerAccounts}.id), 0)
        - coalesce((select sum(${ledgerEntries}.credit) from ${ledgerEntries} where ${ledgerEntries}.account_id = ${ledgerAccounts}.id), 0)`,
    })
    .from(ledgerAccounts)
    .where(eq(ledgerAccounts.businessId, businessId))
    .orderBy(asc(ledgerAccounts.id));

  const rows = balances.map((b) => ({ ...b, balance: num(b.balance) }));
  const pick = (type: string) => rows.filter((r) => r.type === type);
  const total = (type: string) => pick(type).reduce((s, r) => s + r.balance, 0);

  return {
    assets: pick("asset"),
    liabilities: pick("liability"),
    equity: pick("equity"),
    income: pick("income"),
    expenseAccounts: pick("expense"),
    totalAssets: total("asset"),
    totalLiabilities: total("liability"),
    totalEquity: total("equity"),
  };
}

/** Expense totals for a trailing window. */
export async function getExpenseTotals(days = 1) {
  const businessId = await businessScope();
  const [row] = await db
    .select({ amount: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(
      and(
        eq(expenses.businessId, businessId),
        sql`${expenses.incurredOn} >= current_date - ${days - 1}::int`,
      ),
    );
  return num(row?.amount);
}
