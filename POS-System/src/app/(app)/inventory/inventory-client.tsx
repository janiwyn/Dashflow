"use client";

import type { viewInventoryStats, viewPosProducts } from "@/db/queries/views";
import { Boxes, PackageX, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-provider";


type Product = Awaited<ReturnType<typeof viewPosProducts>>[number];

type Props = {
  stats: Awaited<ReturnType<typeof viewInventoryStats>>;
  products: Awaited<ReturnType<typeof viewPosProducts>>;
};

export default function InventoryPage({ stats, products }: Props) {
  const { format: currency } = useCurrency();

  const columns: Column<Product>[] = [
    { key: "id", header: "SKU", render: (p) => <span className="num text-muted-foreground">{p.id}</span> },
    { key: "name", header: "Product", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "category", header: "Category", render: (p) => <span className="text-muted-foreground">{p.category}</span> },
    {
      key: "stock",
      header: "Stock",
      render: (p) => (
        <span
          className={`num inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            p.stock <= 12 ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {p.stock} units
        </span>
      ),
    },
    { key: "price", header: "Price", align: "right", render: (p) => <span className="num">{currency(p.price)}</span> },
    {
      key: "value",
      header: "Stock value",
      align: "right",
      render: (p) => <span className="num font-semibold">{currency(p.price * p.stock)}</span>,
    },
  ];

  return (
    <AppShell
      title="Inventory"
      subtitle={`${products.length} active SKUs · Main Branch`}
      actions={
        <Button size="sm" className="rounded-lg">
          Add product
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Stock value" value={currency(stats.costValue)} icon={Boxes} hint="at cost" />
        <StatCard label="Low stock" value="3" icon={PackageX} hint="below reorder point" />
        <StatCard label="Fastest mover" value="Fresh Milk" delta={21} icon={TrendingUp} hint="180 units / week" />
      </section>

      <DataTable title="Product catalogue" description="Sorted by SKU" columns={columns} rows={products} />
    </AppShell>
  );
}
