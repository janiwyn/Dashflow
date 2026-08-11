import type { Metadata } from "next";

import { viewSuppliers } from "@/db/queries/views";
import SuppliersPage from "./suppliers-client";
import { requireRole } from "@/lib/session";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Suppliers",
  description: "Supplier accounts, delivery history and payables in one register.",
};

export default async function Page() {
  await requireRole("super", "admin", "manager");
  await requireModule("procurement");

  const suppliers = await viewSuppliers();
  return <SuppliersPage suppliers={suppliers} />;
}
