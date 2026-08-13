import type { Metadata } from "next";

import { viewReportStats, viewRevenueSeries } from "@/db/queries/views";
import { longDate } from "@/lib/format";
import ReportsPage from "./reports-client";
import { requireRole } from "@/lib/session";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Reports",
  description: "Daily, weekly and branch-level performance reports for your retail business.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("sales");

  const [stats, revenueSeries] = await Promise.all([viewReportStats(), viewRevenueSeries()]);

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  const subtitle = `Week of ${longDate(weekAgo)} – ${longDate(today)}`;

  return <ReportsPage stats={stats} revenueSeries={revenueSeries} subtitle={subtitle} />;
}
