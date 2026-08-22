import type { Metadata } from "next";

import {
  viewInventoryStats,
  viewLowStockProducts,
  viewPosProducts,
  viewPurchaseOrders,
  viewStockByBranch,
  viewStockLevelBreakdown,
  viewSuppliers,
  viewTopMovers,
} from "@/db/queries/views";
import InventoryPage from "./inventory-client";
import { hasModule, requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Track stock levels, pricing and reorder points across every product line.",
};

export default async function Page() {
  await requireModule("inventory");
  const procurementEnabled = await hasModule("procurement");

  const [stats, products, levels, byBranch, topMovers, lowStock, suppliers, purchaseOrders] = await Promise.all([
    viewInventoryStats(),
    viewPosProducts(),
    viewStockLevelBreakdown(),
    viewStockByBranch(),
    viewTopMovers(5),
    viewLowStockProducts(),
    procurementEnabled ? viewSuppliers() : Promise.resolve([]),
    procurementEnabled ? viewPurchaseOrders() : Promise.resolve([]),
  ]);

  return (
    <InventoryPage
      stats={stats}
      products={products}
      levels={levels}
      byBranch={byBranch}
      topMovers={topMovers}
      lowStock={lowStock}
      suppliers={suppliers}
      purchaseOrders={purchaseOrders}
      procurementEnabled={procurementEnabled}
    />
  );
}
