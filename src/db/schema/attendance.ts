import { relations } from "drizzle-orm";
import { date, integer, pgEnum, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

import { createdAt } from "./_shared";
import { employees } from "./hr";
import { branches, businesses } from "./tenancy";

/** How a clock-in/out was captured — shown next to every record so a manager can spot-check kiosk vs self-service use. */
export const attendanceMethod = pgEnum("attendance_method", ["self", "pin", "biometric", "manual"]);

/**
 * One row per employee per day. Clock-in creates it; clock-out fills in the
 * other half. `manual` rows (and manual edits to either timestamp) are how
 * a manager corrects a missed punch — the method column always says so,
 * it's never silently rewritten to look like a normal clock-in/out.
 */
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: serial("id").primaryKey(),
    businessId: integer("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    clockIn: timestamp("clock_in", { withTimezone: true }),
    clockOut: timestamp("clock_out", { withTimezone: true }),
    clockInMethod: attendanceMethod("clock_in_method"),
    clockOutMethod: attendanceMethod("clock_out_method"),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [unique("attendance_employee_date_unique").on(t.employeeId, t.date)],
);

/**
 * A WebAuthn credential (platform fingerprint/face sensor) bound to one
 * employee. Registered per-device on purpose — a kiosk tablet at the door
 * and an employee's own phone are each their own authenticator, the same
 * way a physical fingerprint reader only knows the fingerprints enrolled
 * on it.
 */
export const employeeCredentials = pgTable("employee_credentials", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceLabel: text("device_label"),
  createdAt: createdAt(),
});

/**
 * Short-lived, single-use challenges for WebAuthn ceremonies. A DB row
 * rather than a cookie or in-memory map because the register/verify calls
 * are two separate server actions with nothing else tying them together,
 * and this has to survive across serverless invocations.
 */
export const webauthnChallenges = pgTable("webauthn_challenges", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  challenge: text("challenge").notNull(),
  createdAt: createdAt(),
});

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  business: one(businesses, { fields: [attendanceRecords.businessId], references: [businesses.id] }),
  branch: one(branches, { fields: [attendanceRecords.branchId], references: [branches.id] }),
  employee: one(employees, { fields: [attendanceRecords.employeeId], references: [employees.id] }),
}));

export const employeeCredentialsRelations = relations(employeeCredentials, ({ one }) => ({
  employee: one(employees, { fields: [employeeCredentials.employeeId], references: [employees.id] }),
}));

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type EmployeeCredential = typeof employeeCredentials.$inferSelect;
