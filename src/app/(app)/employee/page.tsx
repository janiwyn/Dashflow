import type { Metadata } from "next";

import { viewEmployees, viewHrBranches, viewSystemUsers } from "@/db/queries/views";
import EmployeePage from "./employee-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Employee Record",
  description: "Edit an individual employee record, branch and compensation.",
};

export default async function Page() {
  await requireModule("hr");
  const [branches, employees, systemUsers] = await Promise.all([viewHrBranches(), viewEmployees(), viewSystemUsers()]);
  return <EmployeePage branches={branches} employees={employees} systemUsers={systemUsers} />;
}
