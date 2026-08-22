import type { Metadata } from "next";

import { getAllBusinessModules } from "@/db/queries/modules";
import { viewAdmins, viewBusinessGrowth, viewBusinesses, viewPlatformSummary } from "@/db/queries/views";
import type { ModuleKey } from "@/lib/modules";
import SuperReportPage from "./super-report-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "System Reports & Analytics \u2014 Super Admin",
  description: "Platform-wide business growth, subscription health and account metrics.",
};

export default async function Page() {
  await requireRole("super");

  const [businesses, admins, businessGrowth, summary, modulesByBusiness] = await Promise.all([
    viewBusinesses(),
    viewAdmins(),
    viewBusinessGrowth(),
    viewPlatformSummary(),
    getAllBusinessModules(),
  ]);

  // Maps aren't serialisable across the server/client boundary \u2014 flatten to
  // a plain object the same way the Subscriptions page does.
  const modules: Record<number, ModuleKey[]> = Object.fromEntries(
    businesses.map((b) => [b.id, Array.from(modulesByBusiness.get(b.id) ?? [])]),
  );

  return (
    <SuperReportPage
      businesses={businesses}
      admins={admins}
      businessGrowth={businessGrowth}
      summary={summary}
      modules={modules}
    />
  );
}
