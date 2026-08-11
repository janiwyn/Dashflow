import type { Metadata } from "next";

import { getActiveModuleKeys } from "@/db/queries/modules";
import { parseModuleKeys } from "@/lib/modules";
import { getCurrentUser } from "@/lib/session";

import SubscribePage from "./subscribe-client";

export const metadata: Metadata = {
  title: "Subscribe — Dashflow POS",
  description: "Choose the modules your business needs and see the price before you sign up.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ modules?: string }>;
}) {
  const { modules } = await searchParams;
  const user = await getCurrentUser();

  // A signed-in admin/manager is adding to their own business, not creating
  // one — their existing modules are already paid for, so they're excluded
  // from the picker rather than offered again.
  const existingModules = user?.businessId ? Array.from(await getActiveModuleKeys(user.businessId)) : [];

  const initialModules = parseModuleKeys(modules).filter((k) => !existingModules.includes(k));

  // Any signed-in visitor — not just admins with a business — takes the
  // "add to my account" path rather than /signup: routing an authenticated
  // user through /signup only to have it bounce them to /dashboard drops
  // whatever they just picked here on the floor.
  return (
    <SubscribePage
      initialModules={initialModules}
      existingModules={existingModules}
      isLoggedIn={Boolean(user)}
    />
  );
}
