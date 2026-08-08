"use client";

import type { viewSales, viewSalesStats } from "@/db/queries/views";
import { Banknote, Receipt, Undo2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-provider";


type Sale = Awaited<ReturnType<typeof viewSales>>[number];

type Props = {
  stats: Awaited<ReturnType<typeof viewSalesStats>>;
  sales: Awaited<ReturnType<typeof viewSales>>;
};

export default function SalesPage({ stats, sales }: Props) {
  const { format: currency } = useCurrency();

  const columns: Column<Sale>[] = [
    { key: "id", header: "Receipt", render: (r) => <span className="num font-medium">{r.id}</span> },
    { key: "customer", header: "Customer", render: (r) => r.customer },
    { key: "items", header: "Items", render: (r) => <span className="num text-muted-foreground">{r.items}</span> },
    { key: "method", header: "Method", render: (r) => <span className="text-muted-foreground">{r.method}</span> },
    { key: "time", header: "Time", render: (r) => <span className="num text-muted-foreground">{r.time}</span> },
    { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => <span className="num font-semibold">{currency(r.amount)}</span>,
    },
  ];

  return (
    <AppShell
      title="Sales"
      subtitle="All receipts · 5 August 2026"
      actions={
        <Button variant="outline" size="sm" className="rounded-lg">
          Export CSV
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gross sales" value={currency(stats.gross)} delta={stats.grossDelta} icon={Banknote} hint="today" />
        <StatCard label="Receipts issued" value={String(stats.receipts)} delta={stats.receiptsDelta} icon={Receipt} hint={`${stats.pending} pending`} />
        <StatCard label="Refunds" value={currency(stats.refunds)} icon={Undo2} hint={`${stats.refundCount} receipt${stats.refundCount === 1 ? "" : "s"}`} />
      </section>

      <DataTable title="Receipt history" description="Newest first" columns={columns} rows={sales} />
    </AppShell>
  );
}
