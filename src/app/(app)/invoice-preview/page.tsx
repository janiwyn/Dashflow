import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { viewInvoice } from "@/db/queries/views";
import InvoicePreviewPage from "./invoice-preview-client";

export const metadata: Metadata = {
  title: "Invoice Preview",
  description: "Preview and print a customer sales invoice.",
};

export default async function Page() {
  const invoicePreview = await viewInvoice();
  if (!invoicePreview) notFound();
  return <InvoicePreviewPage invoicePreview={invoicePreview} />;
}
