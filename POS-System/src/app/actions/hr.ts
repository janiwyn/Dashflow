"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { employees, payrollRecords } from "@/db/schema";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

export async function createEmployee(input: {
  name: string;
  email: string;
  phone: string;
  position: string;
  baseSalary: number;
  hireDate: string;
  branchId: number | null;
  userId: string | null;
  status: "active" | "inactive";
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Employee name is required." };
  if (!input.position.trim()) return { ok: false, message: "Position is required." };

  await db.insert(employees).values({
    businessId,
    branchId: input.branchId,
    userId: input.userId,
    name: input.name.trim(),
    email: input.email.trim() || null,
    phone: input.phone.trim() || null,
    position: input.position.trim(),
    baseSalary: input.baseSalary,
    hireDate: input.hireDate || new Date().toISOString().slice(0, 10),
    status: input.status,
  });

  revalidatePath("/employees");
  revalidatePath("/employee");
  return { ok: true, message: `${input.name} added.` };
}

export async function updateEmployee(input: {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  baseSalary?: number;
  branchId?: number | null;
  status?: "active" | "inactive";
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const [updated] = await db
    .update(employees)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email.trim() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone.trim() || null } : {}),
      ...(input.position !== undefined ? { position: input.position.trim() } : {}),
      ...(input.baseSalary !== undefined ? { baseSalary: input.baseSalary } : {}),
      ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    })
    .where(and(eq(employees.id, input.id), eq(employees.businessId, businessId)))
    .returning({ id: employees.id });

  if (!updated) return { ok: false, message: "Employee not found." };

  revalidatePath("/employees");
  revalidatePath("/employee");
  return { ok: true, message: "Employee updated." };
}

export async function deleteEmployee(id: number): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");
  const businessId = actor.businessId ?? 1;

  const [deleted] = await db
    .delete(employees)
    .where(and(eq(employees.id, id), eq(employees.businessId, businessId)))
    .returning({ id: employees.id });

  if (!deleted) return { ok: false, message: "Employee not found." };

  revalidatePath("/employees");
  return { ok: true, message: "Employee removed." };
}

/** Marks a payroll run as paid. Gross/net are already persisted on the record. */
export async function setPayrollStatus(
  id: number,
  status: "pending" | "paid",
): Promise<ActionResult> {
  await requireRole("super", "admin", "manager");

  await db.update(payrollRecords).set({ status }).where(eq(payrollRecords.id, id));

  revalidatePath("/payroll");
  revalidatePath("/payslip");
  return { ok: true, message: `Payroll marked ${status}.` };
}

export async function upsertPayrollRecord(input: {
  employeeId: number;
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
}): Promise<ActionResult> {
  await requireRole("super", "admin", "manager");

  const gross =
    input.baseSalary + input.transport + input.housing + input.medical + input.overtime;
  const net = gross - (input.nssf + input.tax + input.loan + input.otherDeductions);

  await db
    .insert(payrollRecords)
    .values({ ...input, gross, net, status: "pending" })
    .onConflictDoUpdate({
      target: [payrollRecords.employeeId, payrollRecords.month],
      set: { ...input, gross, net },
    });

  revalidatePath("/payroll");
  return { ok: true, message: "Payroll saved." };
}
