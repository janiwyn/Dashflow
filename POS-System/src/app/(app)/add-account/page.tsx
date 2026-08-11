import type { Metadata } from "next";

import { viewLedgerAccounts } from "@/db/queries/views";
import AddAccountPage from "./add-account-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Add Account",
  description: "Create and manage the chart of accounts.",
};

export default async function Page() {
  await requireModule("accounting");
  const seedAccounts = await viewLedgerAccounts();
  return <AddAccountPage seedAccounts={seedAccounts} />;
}
