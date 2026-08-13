import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { viewCustomerFile, viewCustomers } from "@/db/queries/views";
import CustomerFilePage from "./customer-file-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Customer File",
  description: "View a customer's account balance, credit history and recent transactions.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireModule("customers");
  const { id } = await searchParams;

  const [customerFile, allCustomers] = await Promise.all([
    viewCustomerFile(id ? Number(id) : undefined),
    viewCustomers(),
  ]);
  if (!customerFile) notFound();

  return <CustomerFilePage customerFile={customerFile} allCustomers={allCustomers} />;
}
