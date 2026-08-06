import type { Metadata } from "next";

import AccountingPage from "./accounting-client";

export const metadata: Metadata = {
  title: "Accounting",
  description: "Chart of accounts, ledgers, cash books and financial statements.",
};

export default function Page() {
  return <AccountingPage />;
}
