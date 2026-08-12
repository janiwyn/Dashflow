import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import { attendanceRecords, branches, employeeCredentials, employees } from "@/db/schema";
import { hasModule } from "@/lib/module-access";
import { getCurrentUser } from "@/lib/session";

import { branchScope, businessScope } from "./_helpers";

/** Clock-ins after this local time count as late — a simple, business-wide default rather than per-shift scheduling. */
export const LATE_CUTOFF_HOUR = 9;

const todayStr = () => new Date().toISOString().slice(0, 10);

export type AttendanceStatus = "present" | "late" | "absent" | "not_yet";

function statusFor(clockIn: Date | null, isToday: boolean): AttendanceStatus {
  if (!clockIn) return isToday ? "not_yet" : "absent";
  return clockIn.getUTCHours() >= LATE_CUTOFF_HOUR ? "late" : "present";
}

/**
 * Staff must never see other employees' check-in details — only managers and
 * above get the full team roster. Returns `undefined` when the viewer isn't
 * staff (no restriction to apply), or the employeeId to lock the query to
 * (possibly `null` if a staff account has no linked employee record, in
 * which case they should see nothing).
 */
async function staffOwnEmployeeIdRestriction(): Promise<number | null | undefined> {
  const user = await getCurrentUser();
  if (!user || user.role !== "staff") return undefined;
  const own = await getOwnEmployeeRecord(user.id);
  return own ? own.id : null;
}

export type BoardRow = {
  employeeId: number;
  name: string;
  position: string;
  branch: string | null;
  clockIn: Date | null;
  clockOut: Date | null;
  clockInMethod: string | null;
  clockOutMethod: string | null;
  status: AttendanceStatus;
  hasBiometric: boolean;
  hasPin: boolean;
  hasLogin: boolean;
};

/** Every active employee's attendance state for today — the main board. */
export async function getTodayBoard(): Promise<BoardRow[]> {
  const businessId = await businessScope();
  const branchId = await branchScope();
  const restrictToEmployeeId = await staffOwnEmployeeIdRestriction();
  const today = todayStr();

  const conditions = [eq(employees.businessId, businessId), eq(employees.status, "active")];
  if (branchId) conditions.push(eq(employees.branchId, branchId));
  if (restrictToEmployeeId !== undefined) conditions.push(eq(employees.id, restrictToEmployeeId ?? -1));
  const where = and(...conditions);

  const rows = await db
    .select({
      employeeId: employees.id,
      name: employees.name,
      position: employees.position,
      branch: branches.name,
      userId: employees.userId,
      pinHash: employees.pinHash,
      clockIn: attendanceRecords.clockIn,
      clockOut: attendanceRecords.clockOut,
      clockInMethod: attendanceRecords.clockInMethod,
      clockOutMethod: attendanceRecords.clockOutMethod,
    })
    .from(employees)
    .leftJoin(branches, eq(employees.branchId, branches.id))
    .leftJoin(
      attendanceRecords,
      and(eq(attendanceRecords.employeeId, employees.id), eq(attendanceRecords.date, today)),
    )
    .where(where)
    .orderBy(employees.name);

  const credentialRows = await db
    .select({ employeeId: employeeCredentials.employeeId })
    .from(employeeCredentials);
  const withBiometric = new Set(credentialRows.map((c) => c.employeeId));

  return rows.map((r) => ({
    employeeId: r.employeeId,
    name: r.name,
    position: r.position,
    branch: r.branch,
    clockIn: r.clockIn,
    clockOut: r.clockOut,
    clockInMethod: r.clockInMethod,
    clockOutMethod: r.clockOutMethod,
    status: statusFor(r.clockIn, true),
    hasBiometric: withBiometric.has(r.employeeId),
    hasPin: Boolean(r.pinHash),
    hasLogin: Boolean(r.userId),
  }));
}

export type HistoryRow = {
  id: number;
  employeeId: number;
  employeeName: string;
  branch: string | null;
  date: string;
  clockIn: Date | null;
  clockOut: Date | null;
  clockInMethod: string | null;
  clockOutMethod: string | null;
  hoursWorked: number | null;
  note: string | null;
};

/** Attendance history, most recent first, optionally scoped to one employee and/or a date window. */
export async function getAttendanceHistory(options?: {
  employeeId?: number;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<HistoryRow[]> {
  const businessId = await businessScope();
  const branchId = await branchScope();
  const restrictToEmployeeId = await staffOwnEmployeeIdRestriction();

  const filters = [eq(attendanceRecords.businessId, businessId)];
  if (branchId) filters.push(eq(attendanceRecords.branchId, branchId));
  if (restrictToEmployeeId !== undefined) filters.push(eq(attendanceRecords.employeeId, restrictToEmployeeId ?? -1));
  if (options?.employeeId) filters.push(eq(attendanceRecords.employeeId, options.employeeId));
  if (options?.from) filters.push(gte(attendanceRecords.date, options.from));
  if (options?.to) filters.push(lte(attendanceRecords.date, options.to));

  const rows = await db
    .select({
      id: attendanceRecords.id,
      employeeId: attendanceRecords.employeeId,
      employeeName: employees.name,
      branch: branches.name,
      date: attendanceRecords.date,
      clockIn: attendanceRecords.clockIn,
      clockOut: attendanceRecords.clockOut,
      clockInMethod: attendanceRecords.clockInMethod,
      clockOutMethod: attendanceRecords.clockOutMethod,
      note: attendanceRecords.note,
    })
    .from(attendanceRecords)
    .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
    .leftJoin(branches, eq(attendanceRecords.branchId, branches.id))
    .where(and(...filters))
    .orderBy(desc(attendanceRecords.date), desc(attendanceRecords.id))
    .limit(options?.limit ?? 100);

  return rows.map((r) => ({
    ...r,
    hoursWorked:
      r.clockIn && r.clockOut ? Math.round(((r.clockOut.getTime() - r.clockIn.getTime()) / 3_600_000) * 10) / 10 : null,
  }));
}

/** The attendance summary tiles: present, late, absent (not clocked in), out of today's active roster. */
export async function getTodaySummary() {
  const board = await getTodayBoard();
  return {
    total: board.length,
    present: board.filter((b) => b.status === "present").length,
    late: board.filter((b) => b.status === "late").length,
    notYet: board.filter((b) => b.status === "not_yet").length,
  };
}

/** Resolves the signed-in user's own employee record, for the self-service widget. */
export async function getOwnEmployeeRecord(userId: string) {
  const businessId = await businessScope();
  const [row] = await db
    .select({ id: employees.id, name: employees.name, branchId: employees.branchId })
    .from(employees)
    .where(and(eq(employees.businessId, businessId), eq(employees.userId, userId), eq(employees.status, "active")))
    .limit(1);
  return row ?? null;
}

export async function getTodayRecordFor(employeeId: number) {
  const today = todayStr();
  const [row] = await db
    .select()
    .from(attendanceRecords)
    .where(and(eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.date, today)))
    .limit(1);
  return row ?? null;
}

/**
 * Gate for anything that "makes a sale" (till checkout, remote order
 * fulfilment): if the business tracks attendance and the acting user has a
 * linked employee record, they must be clocked in — and not yet clocked
 * out — today. Users with no linked employee record (e.g. an owner/admin
 * who isn't tracked in attendance) are never blocked, and businesses that
 * haven't subscribed to the Attendance module aren't affected at all.
 */
export async function assertClockedIn(userId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!(await hasModule("attendance"))) return { ok: true };

  const employee = await getOwnEmployeeRecord(userId);
  if (!employee) return { ok: true };

  const today = await getTodayRecordFor(employee.id);
  if (!today?.clockIn) {
    return { ok: false, message: "Clock in on the Attendance page before making a sale." };
  }
  if (today.clockOut) {
    return { ok: false, message: "You're clocked out for today — clock in again on the Attendance page to keep selling." };
  }
  return { ok: true };
}

/** Employees eligible for kiosk check-in — active roster for the signed-in user's branch scope. */
export async function getKioskRoster() {
  const businessId = await businessScope();
  const branchId = await branchScope();
  const where = branchId
    ? and(eq(employees.businessId, businessId), eq(employees.status, "active"), eq(employees.branchId, branchId))
    : and(eq(employees.businessId, businessId), eq(employees.status, "active"));

  return db
    .select({ id: employees.id, name: employees.name, hasPin: employees.pinHash })
    .from(employees)
    .where(where)
    .orderBy(employees.name)
    .then((rows) => rows.map((r) => ({ id: r.id, name: r.name, hasPin: Boolean(r.hasPin) })));
}
