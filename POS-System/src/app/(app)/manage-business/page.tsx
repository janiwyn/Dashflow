import type { Metadata } from "next";

import { viewBusinesses } from "@/db/queries/views";
import ManageBusinessPage from "./manage-business-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Manage Businesses — Super Admin",
  description: "View, edit, suspend or activate every business registered on the platform.",
};

export default async function Page() {
  // Previously ungated — reachable by any signed-in account, exposing every
  // tenant's name/admin email/phone across the whole platform.
  await requireRole("super");

  const seed = await viewBusinesses();
  return <ManageBusinessPage seed={seed} />;
}
