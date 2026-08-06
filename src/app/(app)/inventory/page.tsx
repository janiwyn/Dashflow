import type { Metadata } from "next";

import { viewInventoryStats, viewPosProducts } from "@/db/queries/views";
import InventoryPage from "./inventory-client";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Track stock levels, pricing and reorder points across every product line.",
};

export default async function Page() {
  const stats = await viewInventoryStats();
  const products = await viewPosProducts();
  return <InventoryPage stats={stats} products={products} />;
}
