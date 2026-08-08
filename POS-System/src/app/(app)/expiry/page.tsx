import type { Metadata } from "next";

import { viewExpiringProducts } from "@/db/queries/views";
import ExpiryPage from "./expiry-client";

export const metadata: Metadata = {
  title: "Expiry Alerts",
  description: "Products nearing their expiry date within the next 7 days.",
};

export default async function Page() {
  const expiringProducts = await viewExpiringProducts();
  return <ExpiryPage expiringProducts={expiringProducts} />;
}
