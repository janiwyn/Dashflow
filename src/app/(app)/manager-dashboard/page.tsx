import type { Metadata } from "next";

import { viewBranches, viewManagerStats } from "@/db/queries/views";
import ManagerDashboardPage from "./manager-dashboard-client";

export const metadata: Metadata = {
  title: "Manager Dashboard",
  description: "Daily sales, expenses and recent transactions for branch managers.",
};

export default async function Page() {
  const stats = await viewManagerStats();
  const branchesData = await viewBranches();
  return <ManagerDashboardPage stats={stats} branchesData={branchesData} />;
}
