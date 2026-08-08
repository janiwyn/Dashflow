import type { Metadata } from "next";

import { viewBusinesses } from "@/db/queries/views";
import SuperDashboard from "./super-client";

export const metadata: Metadata = {
  title: "Super Admin Dashboard",
  description: "System-wide overview of businesses, managers, products, sales and subscriptions.",
};

export default async function Page() {
  const businesses = await viewBusinesses();
  return <SuperDashboard businesses={businesses} />;
}
