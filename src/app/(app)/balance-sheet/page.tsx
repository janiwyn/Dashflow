import type { Metadata } from "next";

import { getBalanceSheet } from "@/db/queries/accounting";
import { requireRole } from "@/lib/session";
import { requireModule } from "@/lib/module-access";
import BalanceSheetPage from "./balance-sheet-client";

export const metadata: Metadata = {
  title: "Balance Sheet",
  description: "Assets, liabilities and owner's equity at a glance.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("accounting");

  const balanceSheet = await getBalanceSheet();
  return <BalanceSheetPage balanceSheet={balanceSheet} />;
}
