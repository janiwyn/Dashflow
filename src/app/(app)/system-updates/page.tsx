import type { Metadata } from "next";

import { viewSystemLogEntries, viewSystemUpdates } from "@/db/queries/views";
import SystemUpdatesPage from "./system-updates-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "System Updates & Maintenance — Super Admin",
  description: "Upload patches, back up the database, clear logs and cache, and review the audit log.",
};

export default async function Page() {
  // Previously ungated — reachable by any signed-in account.
  await requireRole("super");

  const [logs, updates] = await Promise.all([viewSystemLogEntries(), viewSystemUpdates()]);
  return <SystemUpdatesPage logs={logs} updates={updates} />;
}
