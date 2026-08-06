import type { Metadata } from "next";

import { viewBranchSummaries, viewPettyCash } from "@/db/queries/views";
import PettyCashPage from "./petty-cash-client";

export const metadata: Metadata = {
  title: "Petty Cash",
  description: "Manage the petty cash float and record small transactions.",
};

export default async function Page() {
  const pettyCash = await viewPettyCash();
  const branches = await viewBranchSummaries();
  return <PettyCashPage branches={branches} pettyCashBalanceActions={pettyCash.actions} pettyCashTransactions={pettyCash.transactions} />;
}
