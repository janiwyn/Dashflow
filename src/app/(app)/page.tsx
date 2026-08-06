import type { Metadata } from "next";

import { viewDashboardStats, viewPosProducts, viewRevenueSeries, viewSales } from "@/db/queries/views";
import Dashboard from "./overview-client";

export const metadata: Metadata = {
  title: "Meridian POS \u2014 Retail Operations Overview",
  description: "Live sales, inventory and branch performance for your retail business in one clean dashboard.",
};

export default async function Page() {
  const stats = await viewDashboardStats();
  const [products, revenueSeries, sales] = await Promise.all([viewPosProducts(), viewRevenueSeries(), viewSales()]);
  return <Dashboard stats={stats} products={products} revenueSeries={revenueSeries} sales={sales} />;
}
