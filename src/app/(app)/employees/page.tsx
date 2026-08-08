import type { Metadata } from "next";

import { viewEmployees, viewHrBranches, viewSystemUsers } from "@/db/queries/views";
import EmployeesPage from "./employees-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Employees",
  description: "Manage employee records, salaries and branch assignments.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");

  const [branches, initialEmployees, systemUsers] = await Promise.all([viewHrBranches(), viewEmployees(), viewSystemUsers()]);
  return <EmployeesPage branches={branches} initialEmployees={initialEmployees} systemUsers={systemUsers} />;
}
