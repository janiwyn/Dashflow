import type { Metadata } from "next";

import { viewSales, viewSalesStats } from "@/db/queries/views";
import SalesPage from "./sales-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Sales & Receipts",
  description: "Browse, filter and reconcile every receipt issued across your branches.",
};

export default async function Page() {
  await requireModule("sales");
  const stats = await viewSalesStats();
  const sales = await viewSales();
  return <SalesPage stats={stats} sales={sales} />;
}
