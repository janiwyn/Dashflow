"use client";

import type { viewExpiringProducts } from "@/db/queries/views";
import { AlarmClock, Send, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import type { ExpiringProduct } from "@/db/queries/views";


function daysLeft(date: string) {
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return diff;
}

const columns: Column<ExpiringProduct>[] = [
  { key: "name", header: "Product", render: (p) => <span className="font-medium">{p.name}</span> },
  { key: "branch", header: "Branch", render: (p) => <span className="text-muted-foreground">{p.branch}</span> },
  { key: "stock", header: "Stock", align: "right", render: (p) => <span className="num">{p.stock} units</span> },
  { key: "expiry", header: "Expiry date", render: (p) => <span className="num">{p.expiryDate}</span> },
  {
    key: "days",
    header: "Days left",
    align: "right",
    render: (p) => {
      const d = daysLeft(p.expiryDate);
      return (
        <span
          className={`num inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            d <= 3 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning-foreground"
          }`}
        >
          {d} day{d !== 1 ? "s" : ""}
        </span>
      );
    },
  },
];

type Props = {
  expiringProducts: Awaited<ReturnType<typeof viewExpiringProducts>>;
};

export default function ExpiryPage({ expiringProducts }: Props) {
  return (
    <AppShell
      title="Expiry alerts"
      subtitle="Products expiring within the next 7 days"
      actions={
        <Button size="sm" className="rounded-lg">
          <Send className="size-4" /> Notify admin via SMS
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Expiring soon" value={String(expiringProducts.length)} icon={TriangleAlert} hint="within 7 days" />
        <StatCard label="Alert window" value="7 days" icon={AlarmClock} hint="configurable" />
        <StatCard label="Admin phone" value="0781 710 027" icon={Send} hint="receives SMS alerts" />
      </section>

      <DataTable title="Expiring products" description="Sorted by expiry date" columns={columns} rows={expiringProducts} />
    </AppShell>
  );
}
