import type { Metadata } from "next";

import { viewBusinesses } from "@/db/queries/views";
import ManageBusinessPage from "./manage-business-client";

export const metadata: Metadata = {
  title: "Manage Businesses \u2014 Super Admin",
  description: "View, edit, suspend or activate every business registered on the platform.",
};

export default async function Page() {
  const seed = await viewBusinesses();
  return <ManageBusinessPage seed={seed} />;
}
