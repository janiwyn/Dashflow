import type { Metadata } from "next";

import { viewBranchOptions, viewPaymentProofs } from "@/db/queries/views";
import PaymentProofsPage from "./payment-proofs-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Payment Proofs",
  description: "Verify MTN and Airtel mobile money payment screenshots submitted for remote orders.",
};

export default async function Page() {
  await requireModule("sales");
  const [branches, paymentProofs] = await Promise.all([viewBranchOptions(), viewPaymentProofs()]);
  return <PaymentProofsPage branches={branches} paymentProofs={paymentProofs} />;
}
