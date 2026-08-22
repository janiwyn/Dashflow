"use client";

import type {
  viewInventoryStats,
  viewLowStockProducts,
  viewPosProducts,
  viewPurchaseOrders,
  viewStockByBranch,
  viewStockLevelBreakdown,
  viewSuppliers,
  viewTopMovers,
} from "@/db/queries/views";
import { AlertTriangle, Boxes, PackageX, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-provider";

type Product = Awaited<ReturnType<typeof viewPosProducts>>[number];
type PurchaseOrder = Awaited<ReturnType<typeof viewPurchaseOrders>>[number];

type Props = {
  stats: Awaited<ReturnType<typeof viewInventoryStats>>;
  products: Awaited<ReturnType<typeof viewPosProducts>>;
  levels: Awaited<ReturnType<typeof viewStockLevelBreakdown>>;
  byBranch: Awaited<ReturnType<typeof viewStockByBranch>>;
  topMovers: Awaited<ReturnType<typeof viewTopMovers>>;
  lowStock: Awaited<ReturnType<typeof viewLowStockProducts>>;
  suppliers: Awaited<ReturnType<typeof viewSuppliers>>;
  purchaseOrders: Awaited<ReturnType<typeof viewPurchaseOrders>>;
  procurementEnabled: boolean;
};

function ChartPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="panel min-w-0 p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-4 h-64 w-full">{children}</div>
    </div>
  );
}

function PoStatusBadge({ status }: { status: string }) {
  const tone =
    status === "Received"
      ? "bg-success/12 text-success"
      : status === "Pending"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-destructive/12 text-destructive";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{status}</span>;
}

export default function InventoryPage({
  stats,
  products,
  levels,
  byBranch,
  topMovers,
  lowStock,
  suppliers,
  purchaseOrders,
  procurementEnabled,
}: Props) {
  const { format: currency } = useCurrency();

  const levelData = [
    { name: "In stock", value: levels.healthy, color: "var(--color-success)" },
    { name: "Low stock", value: levels.low, color: "var(--color-warning)" },
    { name: "Out of stock", value: levels.out, color: "var(--color-destructive)" },
  ];
  const levelTotal = levelData.reduce((s, l) => s + l.value, 0);

  const tooltipStyle = {
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    fontSize: 12,
  };

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
      header: "Stock value (cost)",
      align: "right",
      render: (p) => <span className="num font-semibold">{currency(p.buyingPrice * p.stock)}</span>,
    },
  ];

  const poColumns: Column<PurchaseOrder>[] = [
    { key: "reference", header: "Order", render: (po) => <span className="num font-medium">{po.reference}</span> },
    { key: "supplier", header: "Supplier", render: (po) => po.supplier },
    { key: "status", header: "Status", render: (po) => <PoStatusBadge status={po.status} /> },
    { key: "date", header: "Ordered", render: (po) => <span className="num text-muted-foreground">{po.orderedAt}</span> },
    { key: "total", header: "Total", align: "right", render: (po) => <span className="num font-semibold">{currency(po.totalCost)}</span> },
  ];

  return (
    <AppShell
      title="Inventory"
      subtitle={`${products.length} active SKUs`}
      actions={
        <Button size="sm" className="rounded-lg" asChild>
          <Link href="/products">Add product</Link>
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" value={String(stats.skuCount)} icon={Boxes} hint={`${stats.stockUnits.toLocaleString()} units in stock`} />
        <StatCard label="Stock value" value={currency(stats.costValue)} icon={ShoppingBag} hint="at cost" />
        <StatCard label="Low stock alerts" value={String(stats.lowStock)} icon={PackageX} hint="below reorder point" />
        <StatCard
          label={procurementEnabled ? "Purchase orders" : "Retail value"}
          value={procurementEnabled ? String(purchaseOrders.length) : currency(stats.retailValue)}
          icon={procurementEnabled ? Truck : ShoppingBag}
          hint={procurementEnabled ? `${purchaseOrders.filter((po) => po.status === "Pending").length} pending` : "at selling price"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Stock level analytics" subtitle="Every product, by stock status">
          {levelTotal === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No products yet.</p>
          ) : (
            <div className="flex h-full items-center gap-4">
              <div className="h-full w-1/2 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={levelData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                      {levelData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 flex-1 space-y-2.5">
                {levelData.map((l) => (
                  <li key={l.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: l.color }} />
                      <span className="truncate text-muted-foreground">{l.name}</span>
                    </span>
                    <span className="num shrink-0 font-semibold">{l.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartPanel>

        <ChartPanel title="Top movers" subtitle="Best sellers by revenue, last 30 days">
          {topMovers.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No sales recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMovers} margin={{ left: -18, right: 6, top: 6 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <Tooltip cursor={{ fill: "var(--color-accent)" }} contentStyle={tooltipStyle} formatter={(v, key) => [key === "revenue" ? currency(Number(v)) : v, key === "revenue" ? "Revenue" : "Units"]} />
                <Bar dataKey="revenue" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Stock by branch" subtitle="Units and value per branch">
          {byBranch.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No branch stock yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBranch} layout="vertical" margin={{ left: 8, right: 24, top: 6 }}>
                <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <Tooltip cursor={{ fill: "var(--color-accent)" }} contentStyle={tooltipStyle} formatter={(v, key) => [key === "value" ? currency(Number(v)) : v, key === "value" ? "Stock value" : "Units"]} />
                <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <div className="panel min-w-0 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            <h2 className="text-base font-semibold">Low stock alerts</h2>
          </div>
          <p className="text-sm text-muted-foreground">Products at or below their reorder point</p>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nothing is low on stock right now.</p>
          ) : (
            <ul className="mt-3 max-h-56 divide-y divide-border overflow-y-auto">
              {lowStock.map((p) => (
                <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.category} · {p.sku}</p>
                  </div>
                  <span className="num shrink-0 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {procurementEnabled && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel min-w-0 p-5">
            <h2 className="text-base font-semibold">Supplier tracking</h2>
            <p className="text-sm text-muted-foreground">Top suppliers by amount owed</p>
            {suppliers.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No suppliers yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {suppliers.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">Last delivery {s.lastDelivery}</p>
                    </div>
                    <span className="num shrink-0 font-semibold">{currency(s.payable)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="secondary" size="sm" className="mt-4 w-full rounded-lg">
              <Link href="/suppliers">View all suppliers</Link>
            </Button>
          </div>

          <DataTable
            title="Recent purchase orders"
            description={`${purchaseOrders.length} orders`}
            columns={poColumns}
            rows={purchaseOrders.slice(0, 6)}
            minWidth={520}
          />
        </section>
      )}

      <DataTable title="Product catalogue" description="Sorted by SKU" columns={columns} rows={products} />
    </AppShell>
  );
}
