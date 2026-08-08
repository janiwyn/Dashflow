import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { viewBusinessSettings } from "@/db/queries/views";
import { requireRole } from "@/lib/session";

import SettingsPage from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Business profile, contact details and currency.",
};

export default async function Page() {
  await requireRole("super", "admin");
  const settings = await viewBusinessSettings();
  if (!settings) notFound();
  return <SettingsPage settings={settings} />;
}
