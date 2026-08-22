import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { viewBusinessSettings, viewSubscriptionUsage } from "@/db/queries/views";
import { requireRole } from "@/lib/session";

import SettingsPage from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Business profile, contact details, currency and subscription.",
};

export default async function Page() {
  const actor = await requireRole("super", "admin");
  // This page edits a single business's profile/currency. A super account
  // has no business of its own, so it belongs on the platform dashboard
  // instead — landing here would otherwise silently edit business #1.
  if (actor.role === "super") redirect("/super");
  const [settings, usage] = await Promise.all([viewBusinessSettings(), viewSubscriptionUsage()]);
  if (!settings) notFound();
  return <SettingsPage settings={settings} usage={usage} />;
}
