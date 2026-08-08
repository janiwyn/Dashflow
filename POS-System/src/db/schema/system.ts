import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { createdAt, money } from "./_shared";
import { users } from "./auth";
import { branches, businesses } from "./tenancy";

export const smsStatus = pgEnum("sms_status", ["queued", "sent", "failed"]);
export const notificationKind = pgEnum("notification_kind", [
  "low_stock",
  "expiry",
  "shop_debtor",
  "customer_debtor",
  "order",
]);

export const smsLogs = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  recipient: text("recipient").notNull(),
  message: text("message").notNull(),
  status: smsStatus("status").notNull().default("queued"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Operational alerts surfaced on /notification and /order-notifications.
 * `kind` decides which of the optional columns are meaningful.
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  kind: notificationKind("kind").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  /** Id of the product / debtor / order the alert points at. */
  referenceId: integer("reference_id"),
  amount: money("amount"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: createdAt(),
});

export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  actor: text("actor").notNull().default("Super Admin"),
  message: text("message").notNull(),
  createdAt: createdAt(),
});

export const systemUpdates = pgTable("system_updates", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  notes: text("notes"),
  uploadedById: text("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const smsLogsRelations = relations(smsLogs, ({ one }) => ({
  business: one(businesses, { fields: [smsLogs.businessId], references: [businesses.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  business: one(businesses, { fields: [notifications.businessId], references: [businesses.id] }),
  branch: one(branches, { fields: [notifications.branchId], references: [branches.id] }),
}));

export type SmsLog = typeof smsLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type SystemUpdate = typeof systemUpdates.$inferSelect;
