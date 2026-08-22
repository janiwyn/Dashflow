import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { viewBusinessSettings, viewProfile, viewSubscriptionUsage } from "@/db/queries/views";
import { requireRole } from "@/lib/session";

import SettingsPage from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your profile, business details, currency and subscription.",
};

export default async function Page() {
  const actor = await requireRole("super", "admin", "manager", "staff");
  // This page's business/subscription tabs edit a single business's profile — a super
  // account has no business of its own, so it belongs on the platform dashboard instead,
  // same as before.
  if (actor.role === "super") redirect("/super");

  const [currentProfile, settings, usage] = await Promise.all([
    viewProfile(),
    viewBusinessSettings(),
    viewSubscriptionUsage(),
  ]);
  if (!currentProfile) notFound();

  const isAdmin = actor.role === "admin";

  return <SettingsPage currentProfile={currentProfile} settings={settings} usage={usage} isAdmin={isAdmin} />;
}
