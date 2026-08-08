import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { viewDashboardStats, viewPosProducts, viewRevenueSeries, viewSales } from "@/db/queries/views";
import { requireUser } from "@/lib/session";
import Dashboard from "./overview-client";

export const metadata: Metadata = {
  title: "Dashboard \u2014 Dashflow POS",
  description: "Live sales, inventory and branch performance for your retail business in one clean dashboard.",
};

/**
 * This full cross-branch overview is for business owners/admins only.
 * Managers and staff are sent to the dashboard scoped to their own role
 * instead of landing here after login.
 */
export default async function Page() {
  const user = await requireUser();
  const role = user.role ?? "staff";

  if (role === "manager") redirect("/manager-dashboard");
  if (role === "staff") redirect("/staff-dashboard");

  const stats = await viewDashboardStats();
  const [products, revenueSeries, sales] = await Promise.all([viewPosProducts(), viewRevenueSeries(), viewSales()]);
  return <Dashboard stats={stats} products={products} revenueSeries={revenueSeries} sales={sales} />;
}
