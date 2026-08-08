import type { Metadata } from "next";

import { viewTransactionsFeed } from "@/db/queries/views";
import AddTransactionPage from "./add-transaction-client";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Auto-generated income and expense transactions across branches.",
};

export default async function Page() {
  const transactionsFeed = await viewTransactionsFeed();
  return <AddTransactionPage transactionsFeed={transactionsFeed} />;
}
