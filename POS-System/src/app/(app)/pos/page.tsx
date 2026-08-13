import type { Metadata } from "next";

import { viewCategories, viewCustomers, viewPosProducts } from "@/db/queries/views";
import { assertClockedIn } from "@/db/queries/attendance";
import Terminal from "./pos-client";
import { requireModule } from "@/lib/module-access";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sales Terminal",
  description: "Fast touch-friendly checkout terminal with cart, discounts and split payments.",
};

export default async function Page() {
  await requireModule("pos");
  const user = await requireUser();
  const [categories, products, clockGate, customers] = await Promise.all([
    viewCategories(),
    viewPosProducts(),
    assertClockedIn(user.id),
    viewCustomers(),
  ]);
  return <Terminal categories={categories} products={products} clockGate={clockGate} customers={customers} />;
}
