import type { Metadata } from "next";

import { viewBranches } from "@/db/queries/views";
import ReportsGeneratorPage from "./reports-generator-client";

export const metadata: Metadata = {
  title: "Report Generator",
  description: "Generate expenses, sales, debtors and payment analysis reports.",
};

export default async function Page() {
  const branchesData = await viewBranches();
  return <ReportsGeneratorPage branchesData={branchesData} />;
}
