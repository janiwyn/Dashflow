import type { Metadata } from "next";

import { viewPosProducts, viewStaffStats } from "@/db/queries/views";
import StaffDashboardPage from "./staff-dashboard-client";

export const metadata: Metadata = {
  title: "Staff Dashboard",
  description: "Record sales and track your daily performance at the till.",
};

export default async function Page() {
  const stats = await viewStaffStats();
  const products = await viewPosProducts();
  return <StaffDashboardPage stats={stats} products={products} />;
}
