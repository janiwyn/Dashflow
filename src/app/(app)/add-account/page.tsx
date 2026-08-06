import type { Metadata } from "next";

import { viewLedgerAccounts } from "@/db/queries/views";
import AddAccountPage from "./add-account-client";

export const metadata: Metadata = {
  title: "Add Account",
  description: "Create and manage the chart of accounts.",
};

export default async function Page() {
  const seedAccounts = await viewLedgerAccounts();
  return <AddAccountPage seedAccounts={seedAccounts} />;
}
