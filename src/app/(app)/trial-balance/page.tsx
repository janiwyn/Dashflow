import type { Metadata } from "next";

import { viewLedgerAccounts } from "@/db/queries/views";
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

  const accounts = await viewLedgerAccounts();
  return <TrialBalancePage accounts={accounts} />;
}
