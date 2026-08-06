import type { Metadata } from "next";

import { viewReportStats, viewRevenueSeries } from "@/db/queries/views";
import ReportsPage from "./reports-client";

export const metadata: Metadata = {
  title: "Reports",
  description: "Daily, weekly and branch-level performance reports for your retail business.",
};

export default async function Page() {
  const stats = await viewReportStats();
  const revenueSeries = await viewRevenueSeries();
  return <ReportsPage stats={stats} revenueSeries={revenueSeries} />;
}
