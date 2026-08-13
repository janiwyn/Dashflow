"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { employees, shiftAssignments, shifts } from "@/db/schema";
import { enforcedBranchId } from "@/db/queries/_helpers";
import { getShifts, getWeekSchedule } from "@/db/queries/schedule";
import { requireRole, requireUser } from "@/lib/session";

import type { ActionResult } from "./users";

function revalidateSchedule() {
  revalidatePath("/attendance");
}

const isValidTime = (t: string) => /^\d{2}:\d{2}$/.test(t);

/** Read-only wrappers so the client can re-fetch a different week/branch without a full page reload. */
export async function fetchWeekSchedule(input: { branchId?: number; weekStart: string }) {
  await requireUser();
  return getWeekSchedule(input);
}

export async function fetchShifts(branchId?: number) {
  await requireUser();
  return getShifts(branchId);
}

export async function createShift(input: {
  name: string;
  branchId: number;
  startTime: string;
  endTime: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const branchId = await enforcedBranchId(input.branchId);
  if (!branchId) return { ok: false, message: "Choose a branch first." };
  if (!input.name.trim()) return { ok: false, message: "Shift name is required." };
  if (!isValidTime(input.startTime) || !isValidTime(input.endTime)) {
    return { ok: false, message: "Enter valid start and end times." };
  }

  await db.insert(shifts).values({
    businessId,
    branchId,
    name: input.name.trim(),
    startTime: input.startTime,
    endTime: input.endTime,
  });

  revalidateSchedule();
  return { ok: true, message: `${input.name.trim()} shift created.` };
}

export async function updateShift(input: {
  id: number;
  name?: string;
  startTime?: string;
  endTime?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (input.startTime !== undefined && !isValidTime(input.startTime)) {
    return { ok: false, message: "Enter a valid start time." };
  }
  if (input.endTime !== undefined && !isValidTime(input.endTime)) {
    return { ok: false, message: "Enter a valid end time." };
  }

  const [updated] = await db
    .update(shifts)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
    })
    .where(and(eq(shifts.id, input.id), eq(shifts.businessId, businessId)))
    .returning({ id: shifts.id });

  if (!updated) return { ok: false, message: "Shift not found." };

  revalidateSchedule();
  return { ok: true, message: "Shift updated." };
}

/** Deleting a shift also removes any days it's scheduled on — reported back so it's never a silent surprise. */
export async function deleteShift(id: number): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const [shift] = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(and(eq(shifts.id, id), eq(shifts.businessId, businessId)))
    .limit(1);
  if (!shift) return { ok: false, message: "Shift not found." };

  const affected = await db.select({ id: shiftAssignments.id }).from(shiftAssignments).where(eq(shiftAssignments.shiftId, id));

  await db.delete(shifts).where(eq(shifts.id, id));

  revalidateSchedule();
  return {
    ok: true,
    message: affected.length > 0 ? `Shift deleted — ${affected.length} scheduled assignment(s) removed too.` : "Shift deleted.",
  };
}

/** Assigns (or replaces) the shift an employee is on for one date — upserts on the employee+date unique constraint. */
export async function assignShift(input: { employeeId: number; shiftId: number; date: string }): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const [employee] = await db
    .select({ id: employees.id, branchId: employees.branchId })
    .from(employees)
    .where(and(eq(employees.id, input.employeeId), eq(employees.businessId, businessId)))
    .limit(1);
  if (!employee) return { ok: false, message: "Employee not found." };
  if (!employee.branchId) return { ok: false, message: "This employee isn't assigned to a branch yet." };

  const enforcedBranch = await enforcedBranchId(employee.branchId);
  if (enforcedBranch !== employee.branchId) {
    return { ok: false, message: "You can only schedule employees in your own branch." };
  }

  const [shift] = await db
    .select({ id: shifts.id, branchId: shifts.branchId, name: shifts.name })
    .from(shifts)
    .where(and(eq(shifts.id, input.shiftId), eq(shifts.businessId, businessId)))
    .limit(1);
  if (!shift) return { ok: false, message: "Shift not found." };
  if (shift.branchId !== employee.branchId) {
    return { ok: false, message: "That shift belongs to a different branch than this employee." };
  }

  await db
    .insert(shiftAssignments)
    .values({ businessId, branchId: employee.branchId, employeeId: employee.id, shiftId: shift.id, date: input.date })
    .onConflictDoUpdate({
      target: [shiftAssignments.employeeId, shiftAssignments.date],
      set: { shiftId: shift.id, branchId: employee.branchId },
    });

  revalidateSchedule();
  return { ok: true, message: `Scheduled for ${shift.name}.` };
}

/** Clears whatever shift an employee has on one date — an unscheduled day, not a deleted employee. */
export async function clearAssignment(input: { employeeId: number; date: string }): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const [employee] = await db
    .select({ id: employees.id, branchId: employees.branchId })
    .from(employees)
    .where(and(eq(employees.id, input.employeeId), eq(employees.businessId, businessId)))
    .limit(1);
  if (!employee) return { ok: false, message: "Employee not found." };

  const enforcedBranch = await enforcedBranchId(employee.branchId ?? undefined);
  if (enforcedBranch !== employee.branchId) {
    return { ok: false, message: "You can only manage schedules in your own branch." };
  }

  await db
    .delete(shiftAssignments)
    .where(and(eq(shiftAssignments.employeeId, input.employeeId), eq(shiftAssignments.date, input.date)));

  revalidateSchedule();
  return { ok: true, message: "Shift cleared." };
}
