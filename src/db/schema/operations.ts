import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { createdAt, money, updatedAt } from "./_shared";
import { users } from "./auth";
import { products } from "./catalog";
import { customers } from "./sales";
import { branches, businesses } from "./tenancy";

export const remoteOrderStatus = pgEnum("remote_order_status", [
  "pending",
  "finished",
  "cancelled",
]);
export const proofMethod = pgEnum("proof_method", ["mtn_merchant", "airtel_merchant"]);
export const proofStatus = pgEnum("proof_status", ["pending", "verified", "rejected"]);

/** Orders placed from the customer storefront, fulfilled at a branch. */
export const remoteOrders = pgTable(
  "remote_orders",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
    reference: text("reference").notNull(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone"),
    deliveryLocation: text("delivery_location"),
    paymentMethod: text("payment_method"),
    amount: money("amount").notNull().default(0),
    status: remoteOrderStatus("status").notNull().default("pending"),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("remote_orders_business_reference_unique").on(t.businessId, t.reference)],
);

export const remoteOrderItems = pgTable("remote_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => remoteOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: money("unit_price").notNull().default(0),
});

/** Mobile-money screenshots customers upload against an order. */
export const paymentProofs = pgTable("payment_proofs", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => remoteOrders.id, { onDelete: "set null" }),
  reference: text("reference").notNull(),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  phone: text("phone"),
  location: text("location"),
  method: proofMethod("method").notNull(),
  status: proofStatus("status").notNull().default("pending"),
  imagePath: text("image_path"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedById: text("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
});

export const tills = pgTable("tills", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  staffId: text("staff_id").references(() => users.id, { onDelete: "set null" }),
  staffName: text("staff_name"),
  phone: text("phone"),
  balance: money("balance").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const tillRemovals = pgTable("till_removals", {
  id: serial("id").primaryKey(),
  tillId: integer("till_id")
    .notNull()
    .references(() => tills.id, { onDelete: "cascade" }),
  amount: money("amount").notNull().default(0),
  approvedByName: text("approved_by_name"),
  /** Snapshot of the till balance after the removal, for audit. */
  balanceAfter: money("balance_after").notNull().default(0),
  removedAt: timestamp("removed_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Shop debtors — goods taken on credit, tracked per branch. */
export const debtors = pgTable("debtors", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  phone: text("phone"),
  itemTaken: text("item_taken"),
  quantity: integer("quantity").notNull().default(0),
  amountPaid: money("amount_paid").notNull().default(0),
  balance: money("balance").notNull().default(0),
  dueDate: timestamp("due_date", { withTimezone: true }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: updatedAt(),
});

export const debtorPayments = pgTable("debtor_payments", {
  id: serial("id").primaryKey(),
  debtorId: integer("debtor_id")
    .notNull()
    .references(() => debtors.id, { onDelete: "cascade" }),
  amount: money("amount").notNull().default(0),
  balanceAfter: money("balance_after").notNull().default(0),
  recordedById: text("recorded_by_id").references(() => users.id, { onDelete: "set null" }),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
});

export const remoteOrdersRelations = relations(remoteOrders, ({ one, many }) => ({
  business: one(businesses, { fields: [remoteOrders.businessId], references: [businesses.id] }),
  branch: one(branches, { fields: [remoteOrders.branchId], references: [branches.id] }),
  items: many(remoteOrderItems),
  proofs: many(paymentProofs),
}));

export const remoteOrderItemsRelations = relations(remoteOrderItems, ({ one }) => ({
  order: one(remoteOrders, { fields: [remoteOrderItems.orderId], references: [remoteOrders.id] }),
}));

export const paymentProofsRelations = relations(paymentProofs, ({ one }) => ({
  order: one(remoteOrders, { fields: [paymentProofs.orderId], references: [remoteOrders.id] }),
  branch: one(branches, { fields: [paymentProofs.branchId], references: [branches.id] }),
}));

export const tillsRelations = relations(tills, ({ one, many }) => ({
  branch: one(branches, { fields: [tills.branchId], references: [branches.id] }),
  removals: many(tillRemovals),
}));

export const tillRemovalsRelations = relations(tillRemovals, ({ one }) => ({
  till: one(tills, { fields: [tillRemovals.tillId], references: [tills.id] }),
}));

export const debtorsRelations = relations(debtors, ({ one, many }) => ({
  branch: one(branches, { fields: [debtors.branchId], references: [branches.id] }),
  payments: many(debtorPayments),
}));

export type RemoteOrder = typeof remoteOrders.$inferSelect;
export type RemoteOrderItem = typeof remoteOrderItems.$inferSelect;
export type PaymentProof = typeof paymentProofs.$inferSelect;
export type Till = typeof tills.$inferSelect;
export type Debtor = typeof debtors.$inferSelect;
