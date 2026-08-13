import type { Metadata } from "next";

import {
  getAttendanceHistory,
  getKioskRoster,
  getOwnEmployeeRecord,
  getTodayBoard,
  getTodayRecordFor,
  getTodaySummary,
} from "@/db/queries/attendance";
import {
  getCurrentWeekStart,
  getDefaultScheduleBranchId,
  getShifts,
  getWeekSchedule,
} from "@/db/queries/schedule";
import { viewHrBranches } from "@/db/queries/views";
import { requireModule } from "@/lib/module-access";
import { requireUser } from "@/lib/session";

import AttendancePage from "./attendance-client";

export const metadata: Metadata = {
  title: "Attendance",
  description: "Clock in/out, biometric enrollment, shift scheduling and attendance history.",
};

export default async function Page() {
  await requireModule("attendance");
  const user = await requireUser();
  const isStaff = user.role === "staff";
  const canManageSchedule = !isStaff;
  const weekStart = getCurrentWeekStart();

  const [board, summary, history, roster, ownEmployee, defaultBranchId, branches] = await Promise.all([
    getTodayBoard(),
    getTodaySummary(),
    getAttendanceHistory({ limit: 100 }),
    getKioskRoster(),
    getOwnEmployeeRecord(user.id),
    getDefaultScheduleBranchId(),
    viewHrBranches(),
  ]);

  const ownToday = ownEmployee ? await getTodayRecordFor(ownEmployee.id) : null;
  const [weekSchedule, shifts] = await Promise.all([
    getWeekSchedule({ branchId: defaultBranchId ?? undefined, weekStart }),
    getShifts(defaultBranchId ?? undefined),
  ]);

  return (
    <AttendancePage
      board={board}
      summary={summary}
      history={history}
      roster={roster}
      ownEmployee={ownEmployee}
      ownToday={
        ownToday
          ? { clockIn: ownToday.clockIn, clockOut: ownToday.clockOut }
          : null
      }
      isStaff={isStaff}
      weekSchedule={weekSchedule}
      shifts={shifts}
      branches={branches}
      showBranchPicker={canManageSchedule && (user.role === "admin" || user.role === "super") && branches.length > 1}
      defaultBranchId={defaultBranchId}
      canManageSchedule={canManageSchedule}
    />
  );
}
