import type { Metadata } from "next";

import { viewEmployees, viewPayrollRecords } from "@/db/queries/views";
import PayrollPage from "./payroll-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Payroll",
  description: "Process employee payroll, allowances, deductions and payment status.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");

  const [employees, initialRecords] = await Promise.all([viewEmployees(), viewPayrollRecords()]);
  return <PayrollPage employees={employees} initialRecords={initialRecords} />;
}
