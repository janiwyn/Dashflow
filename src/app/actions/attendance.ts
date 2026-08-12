"use server";

import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";

import { db } from "@/db";
import { attendanceRecords, employees } from "@/db/schema";
import { getOwnEmployeeRecord, getTodayRecordFor } from "@/db/queries/attendance";
import { requireRole, requireUser } from "@/lib/session";
import {
  createAuthenticationOptions,
  createRegistrationOptions,
  verifyAttendanceAuthentication,
  verifyRegistration,
} from "@/lib/webauthn";

import type { ActionResult } from "./users";

type ClockMethod = "self" | "pin" | "biometric" | "manual";
type PunchResult = ActionResult & { action?: "in" | "out" };

const todayStr = () => new Date().toISOString().slice(0, 10);

function revalidateAttendance() {
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
}

async function punch(
  employeeId: number,
  businessId: number,
  branchId: number | null,
  employeeName: string,
  method: ClockMethod,
): Promise<PunchResult> {
  const existing = await getTodayRecordFor(employeeId);

  if (!existing) {
    await db.insert(attendanceRecords).values({
      businessId,
      branchId,
      employeeId,
      date: todayStr(),
      clockIn: new Date(),
      clockInMethod: method,
    });
    revalidateAttendance();
    return { ok: true, message: `${employeeName} clocked in.`, action: "in" };
  }

  if (!existing.clockOut) {
    await db
      .update(attendanceRecords)
      .set({ clockOut: new Date(), clockOutMethod: method })
      .where(eq(attendanceRecords.id, existing.id));
    revalidateAttendance();
    return { ok: true, message: `${employeeName} clocked out.`, action: "out" };
  }

  return { ok: false, message: `${employeeName} already clocked in and out today.` };
}

/** The logged-in user's own clock-in/out — works for anyone with a linked employee record and no hardware at all. */
export async function clockSelf(): Promise<PunchResult> {
  const user = await requireUser();
  const employee = await getOwnEmployeeRecord(user.id);
  if (!employee) return { ok: false, message: "Your account isn't linked to an employee record." };

  return punch(employee.id, user.businessId ?? 1, employee.branchId, employee.name, "self");
}

/** Kiosk PIN clock-in/out — the always-available fallback when there's no biometric reader. */
export async function clockWithPin(employeeId: number, pin: string): Promise<PunchResult> {
  const actor = await requireUser();
  const businessId = actor.businessId ?? 1;

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.businessId, businessId), eq(employees.status, "active")))
    .limit(1);
  if (!employee) return { ok: false, message: "Employee not found." };
  if (!employee.pinHash) return { ok: false, message: "No PIN set for this employee yet — ask a manager." };

  const valid = await verifyPassword({ hash: employee.pinHash, password: pin });
  if (!valid) return { ok: false, message: "Incorrect PIN." };

  return punch(employee.id, businessId, employee.branchId, employee.name, "pin");
}

/** Sets or resets an employee's kiosk PIN — manager-only, since it's how anyone can clock in as them. */
export async function setEmployeePin(employeeId: number, pin: string): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!/^\d{4,6}$/.test(pin)) return { ok: false, message: "PIN must be 4–6 digits." };

  const [updated] = await db
    .update(employees)
    .set({ pinHash: await hashPassword(pin) })
    .where(and(eq(employees.id, employeeId), eq(employees.businessId, businessId)))
    .returning({ id: employees.id });
  if (!updated) return { ok: false, message: "Employee not found." };

  revalidateAttendance();
  return { ok: true, message: "PIN saved." };
}

async function canManageBiometrics(employeeId: number) {
  const actor = await requireUser();
  const businessId = actor.businessId ?? 1;
  const [employee] = await db
    .select({ id: employees.id, name: employees.name, userId: employees.userId })
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.businessId, businessId)))
    .limit(1);
  if (!employee) return { ok: false as const };

  const isManager = ["super", "admin", "manager"].includes(actor.role ?? "");
  const isSelf = employee.userId === actor.id;
  if (!isManager && !isSelf) return { ok: false as const };

  return { ok: true as const, employee };
}

/** Step 1 of enrolling a fingerprint/face on this device for an employee. */
export async function startBiometricEnrollment(employeeId: number) {
  const check = await canManageBiometrics(employeeId);
  if (!check.ok) return { ok: false as const, message: "Not allowed." };

  const options = await createRegistrationOptions(check.employee.id, check.employee.name);
  return { ok: true as const, options };
}

/** Step 2 — verify what the browser/authenticator signed and store the credential. */
export async function finishBiometricEnrollment(
  employeeId: number,
  response: RegistrationResponseJSON,
  deviceLabel?: string,
): Promise<ActionResult> {
  const check = await canManageBiometrics(employeeId);
  if (!check.ok) return { ok: false, message: "Not allowed." };

  const result = await verifyRegistration(employeeId, response, deviceLabel);
  if (!result.ok) return { ok: false, message: result.error };

  revalidateAttendance();
  return { ok: true, message: "Biometric registered on this device." };
}

/** Kiosk biometric tap, step 1 — no employee pre-selected, any enrolled sensor on this device can answer. */
export async function startBiometricClockIn() {
  const actor = await requireUser();
  const businessId = actor.businessId ?? 1;
  const options = await createAuthenticationOptions(`attend:${businessId}`);
  return { ok: true as const, options };
}

/** Kiosk biometric tap, step 2 — identifies the employee from the credential and punches them. */
export async function finishBiometricClockIn(response: AuthenticationResponseJSON): Promise<PunchResult> {
  const actor = await requireUser();
  const businessId = actor.businessId ?? 1;

  const verified = await verifyAttendanceAuthentication(`attend:${businessId}`, response);
  if (!verified.ok) return { ok: false, message: verified.error };

  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, verified.employeeId), eq(employees.businessId, businessId)))
    .limit(1);
  if (!employee) return { ok: false, message: "This credential isn't registered to this business." };

  return punch(employee.id, businessId, employee.branchId, employee.name, "biometric");
}

/** Manager correction — add or backfill a record the normal punch flow missed. */
export async function upsertAttendanceRecord(input: {
  employeeId: number;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  note?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const [employee] = await db
    .select({ id: employees.id, branchId: employees.branchId })
    .from(employees)
    .where(and(eq(employees.id, input.employeeId), eq(employees.businessId, businessId)))
    .limit(1);
  if (!employee) return { ok: false, message: "Employee not found." };

  const clockIn = input.clockIn ? new Date(`${input.date}T${input.clockIn}:00`) : null;
  const clockOut = input.clockOut ? new Date(`${input.date}T${input.clockOut}:00`) : null;

  const [existing] = await db
    .select({ id: attendanceRecords.id })
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.employeeId, input.employeeId), eq(attendanceRecords.date, input.date)))
    .limit(1);

  if (existing) {
    await db
      .update(attendanceRecords)
      .set({
        clockIn,
        clockOut,
        clockInMethod: clockIn ? "manual" : null,
        clockOutMethod: clockOut ? "manual" : null,
        note: input.note?.trim() || null,
      })
      .where(eq(attendanceRecords.id, existing.id));
  } else {
    await db.insert(attendanceRecords).values({
      businessId,
      branchId: employee.branchId,
      employeeId: input.employeeId,
      date: input.date,
      clockIn,
      clockOut,
      clockInMethod: clockIn ? "manual" : null,
      clockOutMethod: clockOut ? "manual" : null,
      note: input.note?.trim() || null,
    });
  }

  revalidateAttendance();
  return { ok: true, message: "Attendance record saved." };
}
