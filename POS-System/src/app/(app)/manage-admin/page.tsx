import type { Metadata } from "next";

import { viewAdmins } from "@/db/queries/views";
import ManageAdminPage from "./manage-admin-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Manage Business Admins \u2014 Super Admin",
  description: "View, edit, activate or deactivate business admin accounts.",
};

export default async function Page() {
  await requireRole("super");

  const seed = await viewAdmins();
  return <ManageAdminPage seed={seed} />;
}
