import type { Metadata } from "next";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { getActiveModuleKeys } from "@/db/queries/modules";
import { eq } from "drizzle-orm";
import { parseModuleKeys } from "@/lib/modules";
import { isPlanKey } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";

import SubscribePage from "./subscribe-client";

export const metadata: Metadata = {
  title: "Subscribe — Dashflow POS",
  description: "Choose a plan or build your own from individual modules, and see the price before you sign up.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ modules?: string; plan?: string }>;
}) {
  const { modules, plan } = await searchParams;
  const user = await getCurrentUser();

  // A signed-in admin/manager is adding to their own business, not creating
  // one — their existing modules are already paid for, so they're excluded
  // from the picker rather than offered again.
  const existingModules = user?.businessId ? Array.from(await getActiveModuleKeys(user.businessId)) : [];

  const existingPlanKey = user?.businessId
    ? (await db.select({ planKey: businesses.planKey }).from(businesses).where(eq(businesses.id, user.businessId)).limit(1))[0]?.planKey ?? null
    : null;

  const initialModules = parseModuleKeys(modules).filter((k) => !existingModules.includes(k));
  const initialPlan = isPlanKey(plan) ? plan : null;

  // Any signed-in visitor — not just admins with a business — takes the
  // "add to my account" path rather than /signup: routing an authenticated
  // user through /signup only to have it bounce them to /dashboard drops
  // whatever they just picked here on the floor.
  return (
    <SubscribePage
      initialModules={initialModules}
      existingModules={existingModules}
      initialPlan={initialPlan}
      existingPlanKey={isPlanKey(existingPlanKey) ? existingPlanKey : null}
      isLoggedIn={Boolean(user)}
    />
  );
}
