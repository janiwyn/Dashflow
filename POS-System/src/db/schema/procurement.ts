import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { createdAt, money } from "./_shared";
import { users } from "./auth";
import { products, suppliers } from "./catalog";
import { businesses } from "./tenancy";

export const purchaseOrderStatus = pgEnum("purchase_order_status", ["pending", "received", "cancelled"]);

/**
 * A restock order placed with a supplier. `totalCost` is a persisted sum of
 * its line items (not recomputed on read) so a historic order never changes
 * value if a product's buying price is edited later.
 */
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  reference: text("reference").notNull(),
  status: purchaseOrderStatus("status").notNull().default("pending"),
  notes: text("notes"),
  totalCost: money("total_cost").notNull().default(0),
  orderedAt: timestamp("ordered_at", { withTimezone: true }).notNull().defaultNow(),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

/**
 * `productName`/`unitCost` are snapshots at order time — a renamed or
 * deleted product, or a later price change, must never rewrite history.
 */
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: money("unit_cost").notNull().default(0),
  subtotal: money("subtotal").notNull().default(0),
});

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  business: one(businesses, { fields: [purchaseOrders.businessId], references: [businesses.id] }),
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  createdByUser: one(users, { fields: [purchaseOrders.createdBy], references: [users.id] }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderItems.purchaseOrderId], references: [purchaseOrders.id] }),
  product: one(products, { fields: [purchaseOrderItems.productId], references: [products.id] }),
}));

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
