import type { Metadata } from "next";

import { viewExpenses, viewSales } from "@/db/queries/views";
import IncomeStatementPage from "./income-statement-client";

export const metadata: Metadata = {
  title: "Income Statement",
  description: "Profit and loss summary of income against expenses.",
};

export default async function Page() {
  const [sales, expenses] = await Promise.all([viewSales(), viewExpenses()]);
  return <IncomeStatementPage sales={sales} expenses={expenses} />;
}
