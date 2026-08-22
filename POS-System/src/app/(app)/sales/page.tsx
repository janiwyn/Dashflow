import type { Metadata } from "next";

import { viewSales, viewSalesAnalytics, viewSalesStats } from "@/db/queries/views";
import SalesPage from "./sales-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Sales & Receipts",
  description: "Browse, filter and reconcile every receipt issued across your branches.",
};

export default async function Page() {
  await requireModule("sales");
  const [stats, sales, analytics] = await Promise.all([viewSalesStats(), viewSales(), viewSalesAnalytics()]);
  return <SalesPage stats={stats} sales={sales} analytics={analytics} />;
}
