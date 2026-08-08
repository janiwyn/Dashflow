import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { viewCustomerFile } from "@/db/queries/views";
import CustomerFilePage from "./customer-file-client";

export const metadata: Metadata = {
  title: "Customer File",
  description: "View a customer's account balance, credit history and recent transactions.",
};

export default async function Page() {
  const customerFile = await viewCustomerFile();
  if (!customerFile) notFound();
  return <CustomerFilePage customerFile={customerFile} />;
}
