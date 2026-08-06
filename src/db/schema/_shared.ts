import { numeric, timestamp } from "drizzle-orm/pg-core";

/**
 * All monetary amounts are stored as NUMERIC(14,2) and read back as JS numbers.
 * The UI formats major units (KSh), so query results need no conversion.
 */
export const money = (name: string) =>
  numeric(name, { precision: 14, scale: 2, mode: "number" });

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
