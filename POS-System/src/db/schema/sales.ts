import { relations } from "drizzle-orm";
import {
  date,
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
import { branches, businesses } from "./tenancy";

export const customerType = pgEnum("customer_type", ["retail", "wholesale"]);
export const paymentMethod = pgEnum("payment_method", ["cash", "mpesa", "card", "invoice", "bank"]);
export const saleStatus = pgEnum("sale_status", ["paid", "pending", "refunded"]);

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: customerType("type").notNull().default("retail"),
  contact: text("contact"),
  email: text("email"),
  preferredPaymentMethod: text("preferred_payment_method"),
  openingDate: date("opening_date").notNull().defaultNow(),
  /** Outstanding amount the customer owes. */
  accountBalance: money("account_balance").notNull().default(0),
  /** Lifetime credit extended to the customer. */
  amountCredited: money("amount_credited").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sales = pgTable(
  "sales",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
    /** Receipt number shown in the UI, e.g. "RCP-20841". */
    reference: text("reference").notNull(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    /** Kept for walk-ins, where there is no customer record. */
    customerName: text("customer_name").notNull().default("Walk-in"),
    cashierId: text("cashier_id").references(() => users.id, { onDelete: "set null" }),
    cashierName: text("cashier_name"),
    method: paymentMethod("method").notNull().default("cash"),
    status: saleStatus("status").notNull().default("paid"),
    subtotal: money("subtotal").notNull().default(0),
    taxRate: integer("tax_rate").notNull().default(0),
    taxAmount: money("tax_amount").notNull().default(0),
    total: money("total").notNull().default(0),
    amountPaid: money("amount_paid").notNull().default(0),
    dueDate: date("due_date"),
    soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [unique("sales_business_reference_unique").on(t.businessId, t.reference)],
);

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  /** Snapshot of name/price at time of sale — products may be renamed or repriced. */
  name: text("name").notNull(),
  sku: text("sku"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: money("unit_price").notNull().default(0),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  business: one(businesses, { fields: [customers.businessId], references: [businesses.id] }),
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  business: one(businesses, { fields: [sales.businessId], references: [businesses.id] }),
  branch: one(branches, { fields: [sales.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [sales.customerId], references: [customers.id] }),
  cashier: one(users, { fields: [sales.cashierId], references: [users.id] }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] }),
}));

export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type Customer = typeof customers.$inferSelect;
