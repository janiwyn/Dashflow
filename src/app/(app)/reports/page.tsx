import type { Metadata } from "next";

import { viewReportStats, viewRevenueSeries } from "@/db/queries/views";
import ReportsPage from "./reports-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Reports",
  description: "Daily, weekly and branch-level performance reports for your retail business.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");

  const stats = await viewReportStats();
  const revenueSeries = await viewRevenueSeries();
  return <ReportsPage stats={stats} revenueSeries={revenueSeries} />;
}
