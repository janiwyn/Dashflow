import type { Metadata } from "next";

import { viewBranchOptions, viewEmployees, viewTillRemovals, viewTillRemovalsThisWeekCount, viewTills } from "@/db/queries/views";
import TillManagementPage from "./till-management-client";
import { requireModule } from "@/lib/module-access";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Till Management",
  description: "Create tills, assign staff and manage till safe removals across branches.",
};

export default async function Page() {
  // requireModule alone let any signed-in staff account reach this page and
  // see every till's balance — the sidebar's MANAGER_UP restriction was
  // UI-only. Enforced here too now, same as the actions in actions/tills.ts.
  await requireRole("super", "admin", "manager");
  await requireModule("pos");
  const [branches, employees, tillRemovals, removalsThisWeek, tills] = await Promise.all([
    viewBranchOptions(),
    viewEmployees(),
    viewTillRemovals(),
    viewTillRemovalsThisWeekCount(),
    viewTills(),
  ]);
  return (
    <TillManagementPage
      branches={branches}
      employees={employees}
      tillRemovals={tillRemovals}
      removalsThisWeek={removalsThisWeek}
      tills={tills}
    />
  );
}
