import type { Metadata } from "next";

import { viewBusinesses } from "@/db/queries/views";
import AddAdminPage from "./add-admin-client";

export const metadata: Metadata = {
  title: "Add Admin \u2014 Super Admin",
  description: "Create a new business admin account for a tenant business.",
};

export default async function Page() {
  const businesses = await viewBusinesses();
  return <AddAdminPage businesses={businesses} />;
}
