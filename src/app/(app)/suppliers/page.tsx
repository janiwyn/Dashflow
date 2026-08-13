import type { Metadata } from "next";

import { viewCategoryOptions, viewPurchaseOrders, viewStockProducts, viewSuppliers } from "@/db/queries/views";
import SuppliersPage from "./suppliers-client";
import { requireRole } from "@/lib/session";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Suppliers",
  description: "Supplier accounts, contacts, delivery history, payables and purchase orders in one register.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("procurement");

  const [suppliers, products, purchaseOrders, categories] = await Promise.all([
    viewSuppliers(),
    viewStockProducts(),
    viewPurchaseOrders(),
    viewCategoryOptions(),
  ]);
  return <SuppliersPage suppliers={suppliers} products={products} purchaseOrders={purchaseOrders} categories={categories} />;
}
