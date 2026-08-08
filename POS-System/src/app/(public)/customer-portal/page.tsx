import type { Metadata } from "next";

import { CurrencyProvider } from "@/components/currency-provider";
import { viewBranchOptions, viewStorefrontProducts } from "@/db/queries/views";
import { getBusinessProfile } from "@/db/queries/profile";
import type { CurrencyCode } from "@/lib/currency";
import CustomerPortalPage from "./customer-portal-client";

export const metadata: Metadata = {
  title: "Order Online \u2014 Dashflow Retail",
  description: "Browse products and place an order for pickup at your nearest Dashflow Retail branch.",
};

export default async function Page() {
  const [branches, storefrontProducts, business] = await Promise.all([
    viewBranchOptions(),
    viewStorefrontProducts(),
    getBusinessProfile(),
  ]);
  return (
    <CurrencyProvider code={(business?.currency as CurrencyCode) ?? "KES"}>
      <CustomerPortalPage branches={branches} storefrontProducts={storefrontProducts} />
    </CurrencyProvider>
  );
}
