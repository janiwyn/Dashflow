import type { Metadata } from "next";

import { viewBusinesses } from "@/db/queries/views";
import AddAdminPage from "./add-admin-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Add Admin — Super Admin",
  description: "Create a new business admin account for a tenant business.",
};

export default async function Page() {
  await requireRole("super");

  const businesses = await viewBusinesses();
  return <AddAdminPage businesses={businesses} />;
}
