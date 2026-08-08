import type { Metadata } from "next";

import { viewLedgerAccounts, viewLedgerEntries } from "@/db/queries/views";
import LedgerPage from "./ledger-client";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ledger",
  description: "View detailed debit and credit entries per account.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");

  const [accounts, ledgerEntries] = await Promise.all([viewLedgerAccounts(), viewLedgerEntries()]);
  return <LedgerPage accounts={accounts} ledgerEntries={ledgerEntries} />;
}
