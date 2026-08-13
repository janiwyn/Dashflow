import "server-only";

import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import { branches, employees, shiftAssignments, shifts } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

import { staffOwnEmployeeIdRestriction } from "./attendance";
import { businessScope, enforcedBranchId } from "./_helpers";

/** Monday of the week containing `base`, as YYYY-MM-DD (UTC-based, consistent with the rest of attendance). */
function mondayOf(base: Date): string {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function getCurrentWeekStart(): string {
  return mondayOf(new Date());
}

/** The 7 consecutive YYYY-MM-DD dates starting at `weekStart` (expected to be a Monday, but works from any date). */
export function weekDates(weekStart: string): string[] {
  const start = new Date(`${weekStart}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

/** Sensible default branch to open the schedule on: the viewer's own branch, or the business's first branch for an admin. */
export async function getDefaultScheduleBranchId(): Promise<number | null> {
  const user = await getCurrentUser();
  if (user?.branchId) return user.branchId;

  const businessId = await businessScope();
  const [first] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.businessId, businessId))
    .orderBy(asc(branches.id))
    .limit(1);
  return first?.id ?? null;
}

/** Shift templates for one branch (a manager's own branch, or whichever branch an admin has selected). */
export async function getShifts(branchId?: number) {
  const businessId = await businessScope();
  const effectiveBranch = await enforcedBranchId(branchId);

  const conditions = [eq(shifts.businessId, businessId)];
  if (effectiveBranch) conditions.push(eq(shifts.branchId, effectiveBranch));

  return db
    .select()
    .from(shifts)
    .where(and(...conditions))
    .orderBy(asc(shifts.startTime));
}

export type ScheduleCell = { assignmentId: number; shiftId: number; shiftName: string; startTime: string; endTime: string } | null;
export type WeekScheduleRow = { employeeId: number; employeeName: string; days: Record<string, ScheduleCell> };

/**
 * The roster for one branch with whatever shift each employee is assigned
 * for each day of the given week. Staff only ever get their own row back —
 * same privacy rule as the attendance board.
 */
export async function getWeekSchedule(input: { branchId?: number; weekStart: string }): Promise<{
  dates: string[];
  rows: WeekScheduleRow[];
}> {
  const businessId = await businessScope();
  const effectiveBranch = await enforcedBranchId(input.branchId);
  const dates = weekDates(input.weekStart);
  const restrictToEmployeeId = await staffOwnEmployeeIdRestriction();

  const empConditions = [eq(employees.businessId, businessId), eq(employees.status, "active")];
  if (effectiveBranch) empConditions.push(eq(employees.branchId, effectiveBranch));
  if (restrictToEmployeeId !== undefined) empConditions.push(eq(employees.id, restrictToEmployeeId ?? -1));

  const roster = await db
    .select({ id: employees.id, name: employees.name })
    .from(employees)
    .where(and(...empConditions))
    .orderBy(asc(employees.name));

  if (roster.length === 0) return { dates, rows: [] };

  const employeeIds = roster.map((r) => r.id);
  const assignmentRows = await db
    .select({
      id: shiftAssignments.id,
      employeeId: shiftAssignments.employeeId,
      date: shiftAssignments.date,
      shiftId: shifts.id,
      shiftName: shifts.name,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
    })
    .from(shiftAssignments)
    .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
    .where(
      and(
        inArray(shiftAssignments.employeeId, employeeIds),
        gte(shiftAssignments.date, dates[0]),
        lte(shiftAssignments.date, dates[6]),
      ),
    );

  const byEmployee = new Map<number, Map<string, ScheduleCell>>();
  for (const a of assignmentRows) {
    if (!byEmployee.has(a.employeeId)) byEmployee.set(a.employeeId, new Map());
    byEmployee
      .get(a.employeeId)!
      .set(a.date, { assignmentId: a.id, shiftId: a.shiftId, shiftName: a.shiftName, startTime: a.startTime, endTime: a.endTime });
  }

  const rows: WeekScheduleRow[] = roster.map((r) => ({
    employeeId: r.id,
    employeeName: r.name,
    days: Object.fromEntries(dates.map((d) => [d, byEmployee.get(r.id)?.get(d) ?? null])),
  }));

  return { dates, rows };
}
