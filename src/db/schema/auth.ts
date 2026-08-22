import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { createdAt, updatedAt } from "./_shared";
import { branches, businesses } from "./tenancy";

export const userRole = pgEnum("user_role", ["super", "admin", "manager", "staff", "customer"]);
export const userStatus = pgEnum("user_status", ["active", "suspended"]);
export const userTheme = pgEnum("user_theme", ["light", "dark"]);

/**
 * better-auth core tables. `user`, `session`, `account` and `verification` keep
 * the names better-auth expects; app-specific columns are appended to `user`
 * and declared as additionalFields in src/lib/auth.ts.
 */
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),

  // app fields
  username: text("username").unique(),
  phone: text("phone"),
  role: userRole("role").notNull().default("staff"),
  status: userStatus("status").notNull().default("active"),
  theme: userTheme("theme").notNull().default("light"),
  businessId: integer("business_id").references(() => businesses.id, { onDelete: "set null" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),

  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  business: one(businesses, { fields: [users.businessId], references: [businesses.id] }),
  branch: one(branches, { fields: [users.branchId], references: [branches.id] }),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
