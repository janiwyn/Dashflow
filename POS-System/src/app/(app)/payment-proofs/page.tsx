import type { Metadata } from "next";

import { viewBranchOptions, viewHrBranches, viewPaymentProofs } from "@/db/queries/views";
import PaymentProofsPage from "./payment-proofs-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Payment Proofs",
  description: "Verify MTN and Airtel mobile money payment screenshots submitted for remote orders.",
};

export default async function Page() {
  await requireModule("sales");
  const [branchNames, branchOptions, paymentProofs] = await Promise.all([
    viewBranchOptions(),
    viewHrBranches(),
    viewPaymentProofs(),
  ]);
  return <PaymentProofsPage branchNames={branchNames} branchOptions={branchOptions} paymentProofs={paymentProofs} />;
}
