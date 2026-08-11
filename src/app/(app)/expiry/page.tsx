import type { Metadata } from "next";

import { viewExpiringProducts } from "@/db/queries/views";
import ExpiryPage from "./expiry-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Expiry Alerts",
  description: "Products nearing their expiry date within the next 7 days.",
};

export default async function Page() {
  await requireModule("inventory");
  const expiringProducts = await viewExpiringProducts();
  return <ExpiryPage expiringProducts={expiringProducts} />;
}
