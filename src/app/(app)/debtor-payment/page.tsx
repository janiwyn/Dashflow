import type { Metadata } from "next";

import { viewDebtors } from "@/db/queries/views";
import DebtorPaymentPage from "./debtor-payment-client";

export const metadata: Metadata = {
  title: "Debtor Payments",
  description: "Record partial or full debtor repayments and automatically reconcile balances.",
};

export default async function Page() {
  const debtorsSeed = await viewDebtors();
  return <DebtorPaymentPage debtorsSeed={debtorsSeed} />;
}
