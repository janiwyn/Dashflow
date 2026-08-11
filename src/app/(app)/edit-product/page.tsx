import type { Metadata } from "next";

import { viewStockProducts } from "@/db/queries/views";
import EditProductPage from "./edit-product-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Edit Product",
  description: "Update product name, pricing and stock levels.",
};

export default async function Page() {
  await requireModule("inventory");
  const stockProducts = await viewStockProducts();
  return <EditProductPage stockProducts={stockProducts} />;
}
