import { relations } from "drizzle-orm";
import { date, integer, pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";

import { createdAt, updatedAt } from "./_shared";

export const businessStatus = pgEnum("business_status", ["active", "suspended"]);
export const subscriptionStatus = pgEnum("subscription_status", ["active", "pending", "expired"]);
export const branchStatus = pgEnum("branch_status", ["open", "closed"]);

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  phone: text("phone"),
  address: text("address"),
  /** KRA PIN, printed on invoices. */
  taxPin: text("tax_pin"),
  status: businessStatus("status").notNull().default("active"),
  dateRegistered: date("date_registered").notNull().defaultNow(),
  subscriptionStart: date("subscription_start"),
  subscriptionEnd: date("subscription_end"),
  subscriptionStatus: subscriptionStatus("subscription_status").notNull().default("pending"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location"),
  contact: text("contact"),
  /** Denormalised manager name; the authoritative link is user.branch_id + role. */
  managerName: text("manager_name"),
  status: branchStatus("status").notNull().default("open"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const businessesRelations = relations(businesses, ({ many }) => ({
  branches: many(branches),
}));

export const branchesRelations = relations(branches, ({ one }) => ({
  business: one(businesses, { fields: [branches.businessId], references: [businesses.id] }),
}));

export type Business = typeof businesses.$inferSelect;
export type Branch = typeof branches.$inferSelect;
