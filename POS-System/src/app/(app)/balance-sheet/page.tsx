import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import BalanceSheetPage from "./balance-sheet-client";

export const metadata: Metadata = {
  title: "Balance Sheet",
  description: "Assets, liabilities and owner's equity at a glance.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  return <BalanceSheetPage />;
}
