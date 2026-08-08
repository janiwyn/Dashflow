import { relations } from "drizzle-orm";
import { date, integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { createdAt, money, updatedAt } from "./_shared";
import { users } from "./auth";
import { branches, businesses } from "./tenancy";

export const ledgerAccountType = pgEnum("ledger_account_type", [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
]);
export const transactionType = pgEnum("transaction_type", ["income", "expense"]);
export const pettyCashAction = pgEnum("petty_cash_action", ["add", "remove"]);
export const pettyCashPurpose = pgEnum("petty_cash_purpose", ["company", "personal"]);

/** Chart of accounts. */
export const ledgerAccounts = pgTable("ledger_accounts", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: ledgerAccountType("type").notNull(),
  openingBalance: money("opening_balance").notNull().default(0),
  createdAt: createdAt(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => ledgerAccounts.id, { onDelete: "cascade" }),
  entryDate: date("entry_date").notNull(),
  description: text("description").notNull(),
  debit: money("debit").notNull().default(0),
  credit: money("credit").notNull().default(0),
  createdAt: createdAt(),
});

/** Flat income/expense feed powering the accounting dashboard. */
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  entryDate: date("entry_date").notNull(),
  type: transactionType("type").notNull(),
  description: text("description").notNull(),
  /** Always positive; `type` carries the sign. */
  amount: money("amount").notNull().default(0),
  handledById: text("handled_by_id").references(() => users.id, { onDelete: "set null" }),
  handledByName: text("handled_by_name"),
  createdAt: createdAt(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  reference: text("reference").notNull(),
  label: text("label").notNull(),
  category: text("category").notNull(),
  amount: money("amount").notNull().default(0),
  incurredOn: date("incurred_on").notNull(),
  handledById: text("handled_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const cashBookEntries = pgTable("cash_book_entries", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  entryDate: date("entry_date").notNull(),
  particulars: text("particulars").notNull(),
  cashIn: money("cash_in").notNull().default(0),
  bankIn: money("bank_in").notNull().default(0),
  cashOut: money("cash_out").notNull().default(0),
  bankOut: money("bank_out").notNull().default(0),
  /** Where the row came from: Sales, Expenses, Manual Entry… */
  source: text("source").notNull().default("Manual Entry"),
  createdAt: createdAt(),
});

export const pettyCashActions = pgTable("petty_cash_actions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  action: pettyCashAction("action").notNull(),
  amount: money("amount").notNull().default(0),
  approvedByName: text("approved_by_name"),
  actedAt: timestamp("acted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pettyCashTransactions = pgTable("petty_cash_transactions", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  entryDate: date("entry_date").notNull(),
  name: text("name").notNull(),
  purpose: pettyCashPurpose("purpose").notNull().default("company"),
  reason: text("reason"),
  amount: money("amount").notNull().default(0),
  /** Outstanding amount still owed back on a personal advance. */
  balance: money("balance").notNull().default(0),
  approvedByName: text("approved_by_name"),
  createdAt: createdAt(),
});

export const ledgerAccountsRelations = relations(ledgerAccounts, ({ one, many }) => ({
  business: one(businesses, { fields: [ledgerAccounts.businessId], references: [businesses.id] }),
  entries: many(ledgerEntries),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  account: one(ledgerAccounts, {
    fields: [ledgerEntries.accountId],
    references: [ledgerAccounts.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  business: one(businesses, { fields: [transactions.businessId], references: [businesses.id] }),
  branch: one(branches, { fields: [transactions.branchId], references: [branches.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  business: one(businesses, { fields: [expenses.businessId], references: [businesses.id] }),
  branch: one(branches, { fields: [expenses.branchId], references: [branches.id] }),
}));

export type LedgerAccount = typeof ledgerAccounts.$inferSelect;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type CashBookEntry = typeof cashBookEntries.$inferSelect;
export type PettyCashTransaction = typeof pettyCashTransactions.$inferSelect;
