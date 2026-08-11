import type { Metadata } from "next";

import { viewBranchSummaries, viewPettyCash } from "@/db/queries/views";
import PettyCashPage from "./petty-cash-client";
import { requireRole } from "@/lib/session";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Petty Cash",
  description: "Manage the petty cash float and record small transactions.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("accounting");

  const pettyCash = await viewPettyCash();
  const branches = await viewBranchSummaries();
  return <PettyCashPage branches={branches} pettyCashBalanceActions={pettyCash.actions} pettyCashTransactions={pettyCash.transactions} />;
}
