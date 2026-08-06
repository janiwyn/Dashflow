import type { Metadata } from "next";

import { viewBranchNames, viewStockProducts } from "@/db/queries/views";
import ProductImagesPage from "./product-images-client";

export const metadata: Metadata = {
  title: "Product Images",
  description: "Upload and manage product photos used across the POS and catalogue.",
};

export default async function Page() {
  const [branches, stockProducts] = await Promise.all([viewBranchNames(), viewStockProducts()]);
  return <ProductImagesPage branches={branches} stockProducts={stockProducts} />;
}
