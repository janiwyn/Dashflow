import type { Metadata } from "next";

import { viewBusinesses } from "@/db/queries/views";
import SubscriptionPage from "./subscription-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Business Subscriptions \u2014 Super Admin",
  description: "Manage subscription start, end dates and status for every business.",
};

export default async function Page() {
  await requireRole("super");

  const seed = await viewBusinesses();
  return <SubscriptionPage seed={seed} />;
}
