import type { Metadata } from "next";

import { viewSuppliers } from "@/db/queries/views";
import SuppliersPage from "./suppliers-client";

export const metadata: Metadata = {
  title: "Suppliers",
  description: "Supplier accounts, delivery history and payables in one register.",
};

export default async function Page() {
  const suppliers = await viewSuppliers();
  return <SuppliersPage suppliers={suppliers} />;
}
