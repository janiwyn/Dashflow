import type { Metadata } from "next";

import { viewSystemLogs } from "@/db/queries/views";
import SystemUpdatesPage from "./system-updates-client";

export const metadata: Metadata = {
  title: "System Updates & Maintenance \u2014 Super Admin",
  description: "Upload patches, back up the database, clear logs and cache, and review the audit log.",
};

export default async function Page() {
  const seed = await viewSystemLogs();
  return <SystemUpdatesPage seed={seed} />;
}
