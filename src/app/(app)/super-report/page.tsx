import type { Metadata } from "next";

import { viewAdmins, viewBusinessGrowth, viewBusinesses } from "@/db/queries/views";
import SuperReportPage from "./super-report-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "System Reports & Analytics \u2014 Super Admin",
  description: "Platform-wide business growth, subscription health and account metrics.",
};

export default async function Page() {
  await requireRole("super");

  const [businesses, admins, businessGrowth] = await Promise.all([viewBusinesses(), viewAdmins(), viewBusinessGrowth()]);
  return <SuperReportPage businesses={businesses} admins={admins} businessGrowth={businessGrowth} />;
}
