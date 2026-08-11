import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { requireModule } from "@/lib/module-access";
import AccountingPage from "./accounting-client";

export const metadata: Metadata = {
  title: "Accounting",
  description: "Chart of accounts, ledgers, cash books and financial statements.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("accounting");
  return <AccountingPage />;
}
