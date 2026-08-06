import type { Metadata } from "next";

import { viewBranchOptions, viewStorefrontProducts } from "@/db/queries/views";
import CustomerPortalPage from "./customer-portal-client";

export const metadata: Metadata = {
  title: "Order Online \u2014 Dashflow Retail",
  description: "Browse products and place an order for pickup at your nearest Dashflow Retail branch.",
};

export default async function Page() {
  const [branches, storefrontProducts] = await Promise.all([viewBranchOptions(), viewStorefrontProducts()]);
  return <CustomerPortalPage branches={branches} storefrontProducts={storefrontProducts} />;
}
