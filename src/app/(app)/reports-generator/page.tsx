import type { Metadata } from "next";

import { generateReport } from "@/app/actions/reports";
import { viewBranches } from "@/db/queries/views";
import ReportsGeneratorPage from "./reports-generator-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Report Generator",
  description: "Generate expenses, sales, debtors and payment analysis reports.",
};

export default async function Page() {
  await requireModule("sales");
  const [branchesData, initialResult] = await Promise.all([viewBranches(), generateReport("expenses", {})]);
  return <ReportsGeneratorPage branchesData={branchesData} initialResult={initialResult} />;
}
