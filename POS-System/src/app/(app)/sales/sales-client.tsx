"use client";

import { useMemo } from "react";
import type { viewSales, viewSalesAnalytics, viewSalesStats } from "@/db/queries/views";
import { Banknote, CreditCard, Receipt, TrendingUp, Undo2, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
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
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-provider";

type Sale = Awaited<ReturnType<typeof viewSales>>[number];

type Props = {
  stats: Awaited<ReturnType<typeof viewSalesStats>>;
  sales: Awaited<ReturnType<typeof viewSales>>;
  analytics: Awaited<ReturnType<typeof viewSalesAnalytics>>;
};

const SLICE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function ChartPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="panel min-w-0 p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-4 h-64 w-full">{children}</div>
    </div>
  );
}

export default function SalesPage({ stats, sales, analytics }: Props) {
  const { format: currency } = useCurrency();

  const paymentPct = useMemo(() => {
    const grandCount = analytics.paymentBreakdown.reduce((s, p) => s + p.count, 0);
    if (!grandCount) return [];
    return analytics.paymentBreakdown.map((p) => ({
      name: p.method,
      value: Math.round((p.count / grandCount) * 100),
      count: p.count,
    }));
  }, [analytics.paymentBreakdown]);

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

  const tooltipStyle = {
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    fontSize: 12,
  };

  return (
    <AppShell
      title="Sales"
      subtitle="All receipts, newest first"
      actions={
        <Button variant="outline" size="sm" className="rounded-lg">
          Export CSV
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Gross sales" value={currency(stats.gross)} delta={stats.grossDelta} icon={Banknote} hint="last 30 days" />
        <StatCard label="Receipts issued" value={String(stats.receipts)} delta={stats.receiptsDelta} icon={Receipt} hint={`${stats.pending} pending`} />
        <StatCard label="Customers served" value={String(stats.customers)} delta={stats.customersDelta} icon={Users} hint="last 30 days" />
        <StatCard label="Average order value" value={currency(stats.averageOrderValue)} icon={CreditCard} hint="per receipt, last 30 days" />
        <StatCard label="Profit" value={currency(stats.profit)} delta={stats.profitDelta} icon={TrendingUp} hint="last 30 days, est." />
        <StatCard label="Refunds" value={currency(stats.refunds)} icon={Undo2} hint={`${stats.refundCount} receipt${stats.refundCount === 1 ? "" : "s"}, last 30 days`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Sales over time" subtitle="Daily revenue, last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.profitSeries} margin={{ left: -18, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="salesOverTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <Tooltip cursor={{ stroke: "var(--color-border)" }} contentStyle={tooltipStyle} formatter={(v) => currency(Number(v))} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#salesOverTime)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Sales by category" subtitle="Revenue share, last 30 days">
          {analytics.byCategory.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No category sales yet.</p>
          ) : (
            <div className="flex h-full items-center gap-4">
              <div className="h-full w-1/2 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.byCategory} dataKey="revenue" nameKey="name" innerRadius={0} outerRadius="85%" stroke="none">
                      {analytics.byCategory.map((entry, i) => (
                        <Cell key={entry.name} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => currency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 flex-1 space-y-2 overflow-y-auto">
                {analytics.byCategory.map((c, i) => (
                  <li key={c.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                      <span className="truncate text-muted-foreground">{c.name}</span>
                    </span>
                    <span className="num shrink-0 font-medium">{currency(c.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartPanel>

        <ChartPanel title="Sales by branch" subtitle="Revenue by location, last 30 days">
          {analytics.byBranch.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No branch sales yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byBranch} layout="vertical" margin={{ left: 8, right: 24, top: 6 }}>
                <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <Tooltip cursor={{ fill: "var(--color-accent)" }} contentStyle={tooltipStyle} formatter={(v) => currency(Number(v))} />
                <Bar dataKey="revenue" fill="var(--color-chart-2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Top 5 products" subtitle="By revenue, last 30 days">
          {analytics.topProducts.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No product sales yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topProducts} margin={{ left: -18, right: 6, top: 6 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <Tooltip cursor={{ fill: "var(--color-accent)" }} contentStyle={tooltipStyle} formatter={(v) => currency(Number(v))} />
                <Bar dataKey="revenue" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Orders by payment mode" subtitle="Share of receipts, last 30 days">
          {paymentPct.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="flex h-full items-center gap-4">
              <div className="h-full w-1/2 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentPct} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                      {paymentPct.map((entry, i) => (
                        <Cell key={entry.name} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 flex-1 space-y-2">
                {paymentPct.map((p, i) => (
                  <li key={p.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                      <span className="truncate text-muted-foreground">{p.name}</span>
                    </span>
                    <span className="num shrink-0 font-medium">{p.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartPanel>

        <ChartPanel title="Sales vs profit" subtitle="Daily, last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={analytics.profitSeries} margin={{ left: -18, right: 6, top: 6 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <Tooltip cursor={{ fill: "var(--color-accent)" }} contentStyle={tooltipStyle} formatter={(v, key) => [currency(Number(v)), key === "revenue" ? "Sales" : "Profit"]} />
              <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="profit" stroke="var(--color-chart-4)" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <DataTable title="Receipt history" description="Newest first" columns={columns} rows={sales} />
    </AppShell>
  );
}
