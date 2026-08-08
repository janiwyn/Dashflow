import type { Metadata } from "next";

import { viewBranches } from "@/db/queries/views";
import ListBranchesPage from "./list-branches-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Branches",
  description: "Manage all registered branches for your business.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");

  const branchesData = await viewBranches();
  return <ListBranchesPage branchesData={branchesData} />;
}
