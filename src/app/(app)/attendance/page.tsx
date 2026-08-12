import type { Metadata } from "next";

import {
  getAttendanceHistory,
  getKioskRoster,
  getOwnEmployeeRecord,
  getTodayBoard,
  getTodayRecordFor,
  getTodaySummary,
} from "@/db/queries/attendance";
import { requireModule } from "@/lib/module-access";
import { requireUser } from "@/lib/session";

import AttendancePage from "./attendance-client";

export const metadata: Metadata = {
  title: "Attendance",
  description: "Clock in/out, biometric enrollment, and attendance history.",
};

export default async function Page() {
  await requireModule("attendance");
  const user = await requireUser();

  const [board, summary, history, roster, ownEmployee] = await Promise.all([
    getTodayBoard(),
    getTodaySummary(),
    getAttendanceHistory({ limit: 100 }),
    getKioskRoster(),
    getOwnEmployeeRecord(user.id),
  ]);

  const ownToday = ownEmployee ? await getTodayRecordFor(ownEmployee.id) : null;

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
      isStaff={user.role === "staff"}
    />
  );
}
