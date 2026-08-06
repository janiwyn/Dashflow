import { relations } from "drizzle-orm";
import { date, integer, pgTable, serial, text, unique } from "drizzle-orm/pg-core";

import { createdAt, money, updatedAt } from "./_shared";
import { branches, businesses } from "./tenancy";

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique("categories_business_name_unique").on(t.businessId, t.name)],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    /** Human-facing code shown on receipts and the dashboard, e.g. "P-1041". */
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    sellingPrice: money("selling_price").notNull().default(0),
    buyingPrice: money("buying_price").notNull().default(0),
    stock: integer("stock").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(12),
    expiryDate: date("expiry_date"),
    imagePath: text("image_path"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("products_business_sku_unique").on(t.businessId, t.sku)],
);

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  contact: text("contact"),
  email: text("email"),
  lastDelivery: date("last_delivery"),
  payable: money("payable").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  business: one(businesses, { fields: [categories.businessId], references: [businesses.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  business: one(businesses, { fields: [products.businessId], references: [businesses.id] }),
  branch: one(branches, { fields: [products.branchId], references: [branches.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  business: one(businesses, { fields: [suppliers.businessId], references: [businesses.id] }),
  category: one(categories, { fields: [suppliers.categoryId], references: [categories.id] }),
}));

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
