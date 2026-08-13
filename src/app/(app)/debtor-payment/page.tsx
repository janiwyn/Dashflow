import type { Metadata } from "next";

import { viewDebtors, viewHrBranches } from "@/db/queries/views";
import DebtorPaymentPage from "./debtor-payment-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Debtor Payments",
  description: "Record partial or full debtor repayments and automatically reconcile balances.",
};

export default async function Page() {
  await requireModule("customers");
  const [debtors, branches] = await Promise.all([viewDebtors(), viewHrBranches()]);
  return <DebtorPaymentPage debtors={debtors} branches={branches} />;
}
