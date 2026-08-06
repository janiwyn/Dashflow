import { relations } from "drizzle-orm";
import { date, integer, pgEnum, pgTable, serial, text, unique } from "drizzle-orm/pg-core";

import { createdAt, money, updatedAt } from "./_shared";
import { users } from "./auth";
import { branches, businesses } from "./tenancy";

export const employeeStatus = pgEnum("employee_status", ["active", "inactive"]);
export const payrollStatus = pgEnum("payroll_status", ["pending", "paid"]);

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  /** Null when the employee has no system login (e.g. casual staff). */
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  position: text("position").notNull(),
  baseSalary: money("base_salary").notNull().default(0),
  hireDate: date("hire_date").notNull(),
  status: employeeStatus("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const payrollRecords = pgTable(
  "payroll_records",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    /** Payroll period as YYYY-MM. */
    month: text("month").notNull(),

    baseSalary: money("base_salary").notNull().default(0),
    transport: money("transport").notNull().default(0),
    housing: money("housing").notNull().default(0),
    medical: money("medical").notNull().default(0),
    overtime: money("overtime").notNull().default(0),

    nssf: money("nssf").notNull().default(0),
    tax: money("tax").notNull().default(0),
    loan: money("loan").notNull().default(0),
    otherDeductions: money("other_deductions").notNull().default(0),

    /** Persisted so a historic payslip never changes if allowance rules change. */
    gross: money("gross").notNull().default(0),
    net: money("net").notNull().default(0),

    status: payrollStatus("status").notNull().default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("payroll_employee_month_unique").on(t.employeeId, t.month)],
);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  business: one(businesses, { fields: [employees.businessId], references: [businesses.id] }),
  branch: one(branches, { fields: [employees.branchId], references: [branches.id] }),
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  payroll: many(payrollRecords),
}));

export const payrollRecordsRelations = relations(payrollRecords, ({ one }) => ({
  employee: one(employees, { fields: [payrollRecords.employeeId], references: [employees.id] }),
}));

export type Employee = typeof employees.$inferSelect;
export type PayrollRecord = typeof payrollRecords.$inferSelect;
