import type { Metadata } from "next";

import { viewEmployees, viewHrBranches, viewSystemUsers } from "@/db/queries/views";
import EmployeePage from "./employee-client";

export const metadata: Metadata = {
  title: "Employee Record",
  description: "Edit an individual employee record, branch and compensation.",
};

export default async function Page() {
  const [branches, employees, systemUsers] = await Promise.all([viewHrBranches(), viewEmployees(), viewSystemUsers()]);
  return <EmployeePage branches={branches} employees={employees} systemUsers={systemUsers} />;
}
