import { relations } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";

import { createdAt, money, updatedAt } from "./_shared";
import { billingPeriod, businesses } from "./tenancy";

export const paymentStatus = pgEnum("payment_status", ["pending", "success", "failed"]);

/**
 * One row per NexumPay collection attempt for a subscription charge — a
 * business picking a plan/module set and a phone number to pay with. `reference`
 * is what we hand NexumPay as `client_ref` and what both the polling check and
 * the webhook use to find their way back to this row; it's unique so a retried
 * initiate can never collide with an in-flight one. `planKey`/`billingPeriod`
 * and `moduleKeys` are mutually exclusive snapshots of what the payment is
 * for — a package purchase sets the former, an à-la-carte module purchase
 * sets the latter — captured at initiation time so a plan price change later
 * doesn't retroactively change what a pending payment resolves to.
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  reference: text("reference").notNull().unique(),
  /** NexumPay's own transaction id, once known (from transaction_status or the webhook). */
  internalRef: text("internal_ref"),
  planKey: text("plan_key"),
  billingPeriod: billingPeriod("billing_period"),
  moduleKeys: jsonb("module_keys").$type<string[]>(),
  amount: money("amount").notNull(),
  phone: text("phone").notNull(),
  narration: text("narration").notNull(),
  status: paymentStatus("status").notNull().default("pending"),
  /** Raw response bodies kept for support/debugging against an undocumented gateway. */
  gatewayResponse: jsonb("gateway_response"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  business: one(businesses, { fields: [payments.businessId], references: [businesses.id] }),
}));

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
