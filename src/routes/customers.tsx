import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { currency, customers } from "@/lib/pos-data";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Meridian POS" },
      { name: "description", content: "Customer accounts, lifetime spend and outstanding balances at a glance." },
      { property: "og:title", content: "Customers — Meridian POS" },
      { property: "og:description", content: "Accounts, lifetime spend and outstanding balances." },
    ],
  }),
  component: CustomersPage,
});

type Customer = (typeof customers)[number];

const columns: Column<Customer>[] = [
  {
    key: "name",
    header: "Customer",
    render: (c) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-xs font-semibold text-accent-foreground">
          {c.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="truncate font-medium">{c.name}</span>
      </div>
    ),
  },
  { key: "type", header: "Type", render: (c) => <span className="text-muted-foreground">{c.type}</span> },
  { key: "orders", header: "Orders", render: (c) => <span className="num">{c.orders}</span> },
  { key: "spend", header: "Lifetime spend", align: "right", render: (c) => <span className="num">{currency(c.spend)}</span> },
  {
    key: "balance",
    header: "Balance",
    align: "right",
    render: (c) => (
      <span className={`num font-semibold ${c.balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {currency(c.balance)}
      </span>
    ),
  },
];

function CustomersPage() {
  return (
    <AppShell
      title="Customers"
      subtitle="1,204 accounts · 2 with overdue balances"
      actions={
        <Button size="sm" className="rounded-lg">
          Add customer
        </Button>
      }
    >
      <DataTable title="Accounts" description="Top customers by spend" columns={columns} rows={customers} />
    </AppShell>
  );
}