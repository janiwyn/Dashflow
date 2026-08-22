import type { Metadata } from "next";

import { viewBusinesses, viewBusinessTeamMembers } from "@/db/queries/views";
import ManageAdminPage from "./manage-admin-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Business Teams \u2014 Super Admin",
  description: "Every admin, manager and staff account, grouped by the business they belong to.",
};

export default async function Page() {
  await requireRole("super");

  const [businesses, members] = await Promise.all([viewBusinesses(), viewBusinessTeamMembers()]);
  return <ManageAdminPage businesses={businesses} members={members} />;
}
