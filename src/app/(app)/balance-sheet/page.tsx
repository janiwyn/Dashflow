import type { Metadata } from "next";

import BalanceSheetPage from "./balance-sheet-client";

export const metadata: Metadata = {
  title: "Balance Sheet",
  description: "Assets, liabilities and owner's equity at a glance.",
};

export default function Page() {
  return <BalanceSheetPage />;
}
