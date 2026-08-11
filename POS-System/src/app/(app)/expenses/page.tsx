import type { Metadata } from "next";

import { viewExpenses } from "@/db/queries/views";
import ExpensesPage from "./expenses-client";
import { requireRole } from "@/lib/session";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Expenses",
  description: "Record and review operating expenses by category and branch.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("accounting");

  const expenses = await viewExpenses();
  return <ExpensesPage expenses={expenses} />;
}
