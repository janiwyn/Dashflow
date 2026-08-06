import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { branches, employees, payrollRecords, users } from "@/db/schema";

import { businessScope, num } from "./_helpers";

export type EmployeeRow = {
  id: number;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  branch: string | null;
  branchId: number | null;
  position: string;
  baseSalary: number;
  hireDate: string;
  status: "active" | "inactive";
};

const employeeSelect = {
  id: employees.id,
  userId: employees.userId,
  name: employees.name,
  email: employees.email,
  phone: employees.phone,
  branch: branches.name,
  branchId: employees.branchId,
  position: employees.position,
  baseSalary: employees.baseSalary,
  hireDate: employees.hireDate,
  status: employees.status,
};

export async function getEmployees(): Promise<EmployeeRow[]> {
  const businessId = await businessScope();
  const rows = await db
    .select(employeeSelect)
    .from(employees)
    .leftJoin(branches, eq(employees.branchId, branches.id))
    .where(eq(employees.businessId, businessId))
    .orderBy(asc(employees.name));
  return rows.map((r) => ({ ...r, baseSalary: num(r.baseSalary) }));
}

export async function getEmployeeById(id: number): Promise<EmployeeRow | null> {
  const businessId = await businessScope();
  const [row] = await db
    .select(employeeSelect)
    .from(employees)
    .leftJoin(branches, eq(employees.branchId, branches.id))
    .where(and(eq(employees.businessId, businessId), eq(employees.id, id)))
    .limit(1);
  return row ? { ...row, baseSalary: num(row.baseSalary) } : null;
}

export type PayrollRow = {
  id: number;
  employeeId: number;
  employee: string;
  month: string;
  baseSalary: number;
  transport: number;
  housing: number;
  medical: number;
  overtime: number;
  nssf: number;
  tax: number;
  loan: number;
  otherDeductions: number;
  gross: number;
  net: number;
  status: "pending" | "paid";
};

export async function getPayrollRecords(): Promise<PayrollRow[]> {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: payrollRecords.id,
      employeeId: payrollRecords.employeeId,
      employee: employees.name,
      month: payrollRecords.month,
      baseSalary: payrollRecords.baseSalary,
      transport: payrollRecords.transport,
      housing: payrollRecords.housing,
      medical: payrollRecords.medical,
      overtime: payrollRecords.overtime,
      nssf: payrollRecords.nssf,
      tax: payrollRecords.tax,
      loan: payrollRecords.loan,
      otherDeductions: payrollRecords.otherDeductions,
      gross: payrollRecords.gross,
      net: payrollRecords.net,
      status: payrollRecords.status,
    })
    .from(payrollRecords)
    .innerJoin(employees, eq(payrollRecords.employeeId, employees.id))
    .where(eq(employees.businessId, businessId))
    .orderBy(desc(payrollRecords.month), asc(employees.name));

  return rows.map((r) => ({
    ...r,
    baseSalary: num(r.baseSalary),
    transport: num(r.transport),
    housing: num(r.housing),
    medical: num(r.medical),
    overtime: num(r.overtime),
    nssf: num(r.nssf),
    tax: num(r.tax),
    loan: num(r.loan),
    otherDeductions: num(r.otherDeductions),
    gross: num(r.gross),
    net: num(r.net),
  }));
}

export async function getPayrollRecordById(id: number) {
  const rows = await getPayrollRecords();
  return rows.find((r) => r.id === id) ?? null;
}

export type UserAccountRow = {
  id: string;
  username: string | null;
  name: string;
  email: string;
  role: string;
  branch: string | null;
  branchId: number | null;
  status: string;
  createdAt: Date;
};

export async function getUserAccounts(): Promise<UserAccountRow[]> {
  const businessId = await businessScope();
  return db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      branch: branches.name,
      branchId: users.branchId,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(branches, eq(users.branchId, branches.id))
    .where(eq(users.businessId, businessId))
    .orderBy(asc(users.name));
}

/** Users not yet linked to an employee record — the "link login" dropdown. */
export async function getUnlinkedUsers() {
  const businessId = await businessScope();
  return db
    .select({ id: users.id, username: users.username, name: users.name, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.businessId, businessId),
        sql`not exists (select 1 from ${employees} where ${employees}.user_id = ${users}.id)`,
      ),
    )
    .orderBy(asc(users.name));
}

export async function getPayrollSummary() {
  const businessId = await businessScope();
  const [row] = await db
    .select({
      headcount: sql<number>`count(distinct ${employees.id})`,
      monthlyWage: sql<number>`coalesce(sum(${employees.baseSalary}) filter (where ${employees.status} = 'active'), 0)`,
    })
    .from(employees)
    .where(eq(employees.businessId, businessId));

  const [payRow] = await db
    .select({
      pending: sql<number>`coalesce(sum(${payrollRecords.net}) filter (where ${payrollRecords.status} = 'pending'), 0)`,
      paid: sql<number>`coalesce(sum(${payrollRecords.net}) filter (where ${payrollRecords.status} = 'paid'), 0)`,
    })
    .from(payrollRecords)
    .innerJoin(employees, eq(payrollRecords.employeeId, employees.id))
    .where(eq(employees.businessId, businessId));

  return {
    headcount: num(row?.headcount),
    monthlyWage: num(row?.monthlyWage),
    pending: num(payRow?.pending),
    paid: num(payRow?.paid),
  };
}
