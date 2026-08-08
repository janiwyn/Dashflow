"use client";

import { useEffect, useState } from "react";
import type { viewDashboardStats, viewPosProducts, viewRevenueSeries, viewSales } from "@/db/queries/views";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Banknote, Receipt, Boxes, Users, AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { useSessionUser } from "@/components/session-provider";
import { useCurrency } from "@/components/currency-provider";


type Props = {
  stats: Awaited<ReturnType<typeof viewDashboardStats>>;
  products: Awaited<ReturnType<typeof viewPosProducts>>;
  revenueSeries: Awaited<ReturnType<typeof viewRevenueSeries>>;
  sales: Awaited<ReturnType<typeof viewSales>>;
};

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard({ stats, products, revenueSeries, sales }: Props) {
  const user = useSessionUser();
  const { format: currency } = useCurrency();
  const lowStock = products.filter((p) => p.stock <= 12);

  // Computed on mount (not during server render) so the greeting/date always
  // reflects the visitor's own clock and never mismatches between server and client.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const title = now ? `${greetingFor(now.getHours())}, ${firstName}` : `Welcome, ${firstName}`;
  const dateLabel = now
    ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : "";
  const subtitle = now
    ? user.branch
      ? `${dateLabel} · ${user.branch}`
      : dateLabel
    : undefined;

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      actions={
        <Button variant="outline" size="sm" className="rounded-lg">
          Export day sheet
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue today" value={currency(stats.todayRevenue)} delta={stats.revenueDelta} icon={Banknote} hint="vs yesterday" />
        <StatCard label="Receipts" value={String(stats.receipts)} delta={stats.receiptsDelta} icon={Receipt} hint={`avg ${currency(stats.averageBasket)}`} />
        <StatCard label="Stock value" value={currency(stats.stockValue)} icon={Boxes} hint={`${stats.lowStockCount} items low`} />
        <StatCard label="Customers" value={String(stats.customers)} icon={Users} hint="on account" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="panel min-w-0 p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">Revenue this week</h2>
              <p className="truncate text-sm text-muted-foreground">Across all branches</p>
            </div>
            <p className="num shrink-0 text-lg font-semibold">{currency(stats.weekRevenue)}</p>
          </div>
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ left: -18, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(v: number) => `${v / 1000}k`}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                />
                <Tooltip
                  cursor={{ stroke: "var(--color-border)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                  formatter={(v) => currency(Number(v))}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel min-w-0 p-5">
          <div className="flex min-w-0 items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <h2 className="truncate text-base font-semibold">Low stock alerts</h2>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {lowStock.map((p) => (
              <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.category} · {p.id}</p>
                </div>
                <Badge variant="outline" className="num shrink-0 border-warning/40 bg-warning/10 text-warning-foreground">
                  {p.stock} left
                </Badge>
              </li>
            ))}
          </ul>
          <Button variant="secondary" size="sm" className="mt-4 w-full rounded-lg">
            Create purchase order
          </Button>
        </div>
      </section>

      <section className="panel min-w-0 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
          <h2 className="truncate text-base font-semibold">Recent receipts</h2>
          <Button variant="ghost" size="sm" className="shrink-0 rounded-lg">
            View all
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Receipt</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Method</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.slice(0, 5).map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-muted/50">
                  <td className="num px-5 py-3 font-medium">{s.id}</td>
                  <td className="px-5 py-3">{s.customer}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.method}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="num px-5 py-3 text-right font-semibold">{currency(s.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
