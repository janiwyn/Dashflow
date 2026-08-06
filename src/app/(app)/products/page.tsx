import type { Metadata } from "next";

import { viewBranchNames, viewStockProducts } from "@/db/queries/views";
import ProductsPage from "./products-client";

export const metadata: Metadata = {
  title: "Products",
  description: "Add, browse and remove products across every branch.",
};

export default async function Page() {
  const [branches, stockProducts] = await Promise.all([viewBranchNames(), viewStockProducts()]);
  return <ProductsPage branches={branches} stockProducts={stockProducts} />;
}
