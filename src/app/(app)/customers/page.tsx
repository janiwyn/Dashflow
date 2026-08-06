import type { Metadata } from "next";

import { viewCustomers } from "@/db/queries/views";
import CustomersPage from "./customers-client";

export const metadata: Metadata = {
  title: "Customers",
  description: "Customer accounts, lifetime spend and outstanding balances at a glance.",
};

export default async function Page() {
  const customers = await viewCustomers();
  return <CustomersPage customers={customers} />;
}
