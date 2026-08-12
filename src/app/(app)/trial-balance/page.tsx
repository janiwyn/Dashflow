import type { Metadata } from "next";

import { getTrialBalance } from "@/db/queries/accounting";
import TrialBalancePage from "./trial-balance-client";
import { requireRole } from "@/lib/session";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Trial Balance",
  description: "Verify that total debits equal total credits across accounts.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("accounting");

  const trialBalance = await getTrialBalance();
  return <TrialBalancePage trialBalance={trialBalance} />;
}
