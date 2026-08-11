import type { Metadata } from "next";

import { viewTransactionsFeed } from "@/db/queries/views";
import AddTransactionPage from "./add-transaction-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Auto-generated income and expense transactions across branches.",
};

export default async function Page() {
  await requireModule("accounting");
  const transactionsFeed = await viewTransactionsFeed();
  return <AddTransactionPage transactionsFeed={transactionsFeed} />;
}
