import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  viewDashboardStats,
  viewLowStockProducts,
  viewRevenueSeries,
  viewSales,
  viewSuppliers,
} from "@/db/queries/views";
import { hasModule } from "@/lib/module-access";
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

  // A super account has no businessId of its own (it's platform staff, not
  // a tenant) — every ordinary tenant-scoped query below falls back to
  // `user.businessId ?? 1`, which would silently show business #1's data as
  // if it were "the" dashboard. Send super straight to the real cross-
  // tenant dashboard instead.
  if (role === "super") redirect("/super");
  if (role === "manager") redirect("/manager-dashboard");
  if (role === "staff") redirect("/staff-dashboard");

  const stats = await viewDashboardStats();
  const procurementEnabled = await hasModule("procurement");
  const [lowStockProducts, revenueSeries, sales] = await Promise.all([
    viewLowStockProducts(),
    viewRevenueSeries(),
    viewSales(),
  ]);
  const suppliers = procurementEnabled ? await viewSuppliers() : [];
  return (
    <Dashboard
      stats={stats}
      lowStockProducts={lowStockProducts}
      revenueSeries={revenueSeries}
      sales={sales}
      suppliers={suppliers}
      procurementEnabled={procurementEnabled}
    />
  );
}
