import type { Metadata } from "next";

import { viewBranchSummaries } from "@/db/queries/views";
import BranchesPage from "./branches-client";

export const metadata: Metadata = {
  title: "Branches",
  description: "Monitor every branch: managers, staffing and today's takings.",
};

export default async function Page() {
  const branches = await viewBranchSummaries();
  return <BranchesPage branches={branches} />;
}
