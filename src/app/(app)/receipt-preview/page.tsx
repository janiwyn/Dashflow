import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { viewReceipt } from "@/db/queries/views";
import ReceiptPreviewPage from "./receipt-preview-client";

export const metadata: Metadata = {
  title: "Receipt Preview",
  description: "Preview and print a customer receipt before closing out a sale.",
};

export default async function Page() {
  const receiptSample = await viewReceipt();
  if (!receiptSample) notFound();
  return <ReceiptPreviewPage receiptSample={receiptSample} />;
}
