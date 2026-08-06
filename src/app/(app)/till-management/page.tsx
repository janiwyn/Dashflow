import type { Metadata } from "next";

import { viewBranchOptions, viewTillRemovals, viewTills } from "@/db/queries/views";
import TillManagementPage from "./till-management-client";

export const metadata: Metadata = {
  title: "Till Management",
  description: "Create tills, assign staff and manage till safe removals across branches.",
};

export default async function Page() {
  const [branches, tillRemovals, tills] = await Promise.all([viewBranchOptions(), viewTillRemovals(), viewTills()]);
  return <TillManagementPage branches={branches} tillRemovals={tillRemovals} tills={tills} />;
}
