"use client";

import type { viewReportStats, viewRevenueSeries } from "@/db/queries/views";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Banknote, Percent, ShoppingBag } from "lucide-react";
import { useCurrency } from "@/components/currency-provider";


type Props = {
  stats: Awaited<ReturnType<typeof viewReportStats>>;
  revenueSeries: Awaited<ReturnType<typeof viewRevenueSeries>>;
};

export default function ReportsPage({ stats, revenueSeries }: Props) {
  const { format: currency } = useCurrency();
  return (
    <AppShell
      title="Reports"
      subtitle="Week of 30 July – 5 August 2026"
      actions={
        <Button variant="outline" size="sm" className="rounded-lg">
          Download PDF
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Weekly revenue" value={currency(stats.weekRevenue)} icon={Banknote} hint="last 7 days" />
        <StatCard label="Gross margin" value="31.4%" delta={1.8} icon={Percent} hint="after cost of sales" />
        <StatCard label="Orders" value={String(stats.orders)} icon={ShoppingBag} hint={`avg ${stats.averagePerDay} / day`} />
      </section>

      <section className="panel min-w-0 p-5">
        <h2 className="text-base font-semibold">Orders per day</h2>
        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueSeries} margin={{ left: -20, right: 6, top: 6 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} width={54} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="orders" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </AppShell>
  );
}
