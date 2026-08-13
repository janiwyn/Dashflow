import type { Metadata } from "next";

import { viewBranches, viewManagerStats, viewSales } from "@/db/queries/views";
import { requireRole } from "@/lib/session";
import ManagerDashboardPage from "./manager-dashboard-client";

export const metadata: Metadata = {
  title: "Manager Dashboard",
  description: "Daily sales, expenses and recent transactions for branch managers.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  const [stats, branchesData, sales] = await Promise.all([viewManagerStats(), viewBranches(), viewSales(20)]);
  return <ManagerDashboardPage stats={stats} branchesData={branchesData} sales={sales} />;
}
