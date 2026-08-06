import type { Metadata } from "next";

import { viewAdmins, viewBusinessGrowth, viewBusinesses } from "@/db/queries/views";
import SuperReportPage from "./super-report-client";

export const metadata: Metadata = {
  title: "System Reports & Analytics \u2014 Super Admin",
  description: "Platform-wide business growth, subscription health and account metrics.",
};

export default async function Page() {
  const [businesses, admins, businessGrowth] = await Promise.all([viewBusinesses(), viewAdmins(), viewBusinessGrowth()]);
  return <SuperReportPage businesses={businesses} admins={admins} businessGrowth={businessGrowth} />;
}
