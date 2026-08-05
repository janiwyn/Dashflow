import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Receipt, Undo2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/routes/index";
import { Button } from "@/components/ui/button";
import { currency, sales } from "@/lib/pos-data";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales & Receipts — Meridian POS" },
      { name: "description", content: "Browse, filter and reconcile every receipt issued across your branches." },
      { property: "og:title", content: "Sales & Receipts — Meridian POS" },
      { property: "og:description", content: "Browse, filter and reconcile every receipt across branches." },
    ],
  }),
  component: SalesPage,
});

type Sale = (typeof sales)[number];

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

function SalesPage() {
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
        <StatCard label="Gross sales" value={currency(268400)} delta={12.4} icon={Banknote} hint="today" />
        <StatCard label="Receipts issued" value="288" delta={6.1} icon={Receipt} hint="7 pending" />
        <StatCard label="Refunds" value={currency(1240)} delta={-18} icon={Undo2} hint="1 receipt" />
      </section>

      <DataTable title="Receipt history" description="Newest first" columns={columns} rows={sales} />
    </AppShell>
  );
}