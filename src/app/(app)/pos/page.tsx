import type { Metadata } from "next";

import { viewCategories, viewPosProducts } from "@/db/queries/views";
import Terminal from "./pos-client";

export const metadata: Metadata = {
  title: "Sales Terminal",
  description: "Fast touch-friendly checkout terminal with cart, discounts and split payments.",
};

export default async function Page() {
  const [categories, products] = await Promise.all([viewCategories(), viewPosProducts()]);
  return <Terminal categories={categories} products={products} />;
}
