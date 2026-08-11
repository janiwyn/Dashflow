import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";

import { createdAt } from "./_shared";
import { businesses } from "./tenancy";

/**
 * The platform's fixed module catalog. New modules are added here (and in
 * src/lib/modules.ts, which carries the display metadata) — the set is
 * curated by the platform, not created ad hoc by tenants.
 */
export const moduleKey = pgEnum("module_key", [
  "pos",
  "inventory",
  "sales",
  "accounting",
  "procurement",
  "customers",
  "hr",
  "attendance",
  "payroll",
]);

/**
 * Presence = subscribed. A business has a row per module it has activated;
 * removing the row deactivates the module. This is the single source of
 * truth `requireModule()` and the sidebar check against.
 */
export const businessModules = pgTable(
  "business_modules",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    moduleKey: moduleKey("module_key").notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [unique("business_modules_business_module_unique").on(t.businessId, t.moduleKey)],
);

export const businessModulesRelations = relations(businessModules, ({ one }) => ({
  business: one(businesses, { fields: [businessModules.businessId], references: [businesses.id] }),
}));

export type BusinessModule = typeof businessModules.$inferSelect;
