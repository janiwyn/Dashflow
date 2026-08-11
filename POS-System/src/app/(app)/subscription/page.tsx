import type { Metadata } from "next";

import { getAllBusinessModules } from "@/db/queries/modules";
import { viewBusinesses } from "@/db/queries/views";
import SubscriptionPage from "./subscription-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Business Subscriptions \u2014 Super Admin",
  description: "Manage subscription periods and active modules for every business.",
};

export default async function Page() {
  await requireRole("super");

  const [seed, modulesByBusiness] = await Promise.all([viewBusinesses(), getAllBusinessModules()]);
  const modules = Object.fromEntries(
    seed.map((b) => [b.id, Array.from(modulesByBusiness.get(b.id) ?? [])]),
  );

  return <SubscriptionPage seed={seed} modules={modules} />;
}
