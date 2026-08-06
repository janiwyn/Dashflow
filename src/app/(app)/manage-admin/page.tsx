import type { Metadata } from "next";

import { viewAdmins } from "@/db/queries/views";
import ManageAdminPage from "./manage-admin-client";

export const metadata: Metadata = {
  title: "Manage Business Admins \u2014 Super Admin",
  description: "View, edit, activate or deactivate business admin accounts.",
};

export default async function Page() {
  const seed = await viewAdmins();
  return <ManageAdminPage seed={seed} />;
}
