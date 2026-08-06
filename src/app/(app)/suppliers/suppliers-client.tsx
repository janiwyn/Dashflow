"use client";

import type { viewSuppliers } from "@/db/queries/views";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/format";


type Supplier = Awaited<ReturnType<typeof viewSuppliers>>[number];

const columns: Column<Supplier>[] = [
  { key: "name", header: "Supplier", render: (s) => <span className="font-medium">{s.name}</span> },
  { key: "category", header: "Category", render: (s) => <span className="text-muted-foreground">{s.category}</span> },
  { key: "last", header: "Last delivery", render: (s) => <span className="text-muted-foreground">{s.lastDelivery}</span> },
  {
    key: "payable",
    header: "Payable",
    align: "right",
    render: (s) => (
      <span className={`num font-semibold ${s.payable > 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {currency(s.payable)}
      </span>
    ),
  },
];

type Props = {
  suppliers: Awaited<ReturnType<typeof viewSuppliers>>;
};

export default function SuppliersPage({ suppliers }: Props) {
  return (
    <AppShell
      title="Suppliers"
      subtitle={`${suppliers.length} active suppliers · ${currency(suppliers.reduce((s, x) => s + x.payable, 0))} payable`}
      actions={
        <Button size="sm" className="rounded-lg">
          New purchase order
        </Button>
      }
    >
      <DataTable title="Supplier register" columns={columns} rows={suppliers} minWidth={640} />
    </AppShell>
  );
}
