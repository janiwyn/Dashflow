import type { Metadata } from "next";

import {
  viewIncomeStatementSummary,
  viewMonthlyRevenueTrend,
  viewReportStats,
  viewRevenueSeries,
  viewSalesAnalytics,
} from "@/db/queries/views";
import { longDate } from "@/lib/format";
import ReportsPage from "./reports-client";
import { requireRole } from "@/lib/session";
import { hasModule, requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Reports",
  description: "A full visual picture of how the business has been performing.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("sales");

  const accountingEnabled = await hasModule("accounting");

  const [stats, revenueSeries, monthlyTrend, analytics, income] = await Promise.all([
    viewReportStats(),
    viewRevenueSeries(),
    viewMonthlyRevenueTrend(6),
    viewSalesAnalytics(),
    accountingEnabled ? viewIncomeStatementSummary(30) : Promise.resolve(null),
  ]);

  const today = new Date();
  const subtitle = `Full business overview as of ${longDate(today)}`;

  return (
    <ReportsPage
      stats={stats}
      revenueSeries={revenueSeries}
      monthlyTrend={monthlyTrend}
      analytics={analytics}
      income={income}
      subtitle={subtitle}
    />
  );
}
