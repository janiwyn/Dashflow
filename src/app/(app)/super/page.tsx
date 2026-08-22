import type { Metadata } from "next";

import { getAllBusinessModules } from "@/db/queries/modules";
import { viewBusinessGrowth, viewBusinesses, viewPlatformSummary, viewSystemLogs } from "@/db/queries/views";
import type { ModuleKey } from "@/lib/modules";
import SuperDashboard from "./super-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Super Admin Dashboard",
  description: "System-wide overview of businesses, managers, products, sales and subscriptions.",
};

export default async function Page() {
  // Previously ungated — any signed-in staff/manager/admin account could
  // reach this cross-tenant dashboard by typing the URL, since middleware.ts
  // only checks that a session cookie exists, not the role on it.
  await requireRole("super");

  const [summary, growth, businesses, activity, modulesByBusiness] = await Promise.all([
    viewPlatformSummary(),
    viewBusinessGrowth(),
    viewBusinesses(),
    viewSystemLogs(),
    getAllBusinessModules(),
  ]);

  const modules: Record<number, ModuleKey[]> = Object.fromEntries(
    businesses.map((b) => [b.id, Array.from(modulesByBusiness.get(b.id) ?? [])]),
  );

  return (
    <SuperDashboard
      summary={summary}
      growth={growth}
      businesses={businesses}
      activity={activity.slice(0, 6)}
      modules={modules}
    />
  );
}
