import type { Metadata } from "next";

import { getOwnEmployeeRecord, getTodayRecordFor } from "@/db/queries/attendance";
import { viewMySalesToday, viewStaffStats } from "@/db/queries/views";
import { hasModule } from "@/lib/module-access";
import { requireUser } from "@/lib/session";
import StaffDashboardPage from "./staff-dashboard-client";

export const metadata: Metadata = {
  title: "Staff Dashboard",
  description: "Your sales today and quick access to the till.",
};

export default async function Page() {
  const user = await requireUser();
  const attendanceEnabled = await hasModule("attendance");

  const [stats, mySales] = await Promise.all([viewStaffStats(), viewMySalesToday()]);
  const ownEmployee = attendanceEnabled ? await getOwnEmployeeRecord(user.id) : null;
  const ownToday = ownEmployee ? await getTodayRecordFor(ownEmployee.id) : null;

  return (
    <StaffDashboardPage
      stats={stats}
      mySales={mySales}
      attendanceEnabled={attendanceEnabled}
      ownEmployee={ownEmployee}
      ownToday={ownToday ? { clockIn: ownToday.clockIn, clockOut: ownToday.clockOut } : null}
    />
  );
}
