import type { Metadata } from "next";

import { viewExpenses } from "@/db/queries/views";
import ExpensesPage from "./expenses-client";

export const metadata: Metadata = {
  title: "Expenses",
  description: "Record and review operating expenses by category and branch.",
};

export default async function Page() {
  const expenses = await viewExpenses();
  return <ExpensesPage expenses={expenses} />;
}
