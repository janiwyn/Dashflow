import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Banknote, Percent, ShoppingBag } from "lucide-react";
import { currency, revenueSeries } from "@/lib/pos-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Meridian POS" },
      { name: "description", content: "Daily, weekly and branch-level performance reports for your retail business." },
      { property: "og:title", content: "Reports — Meridian POS" },
      { property: "og:description", content: "Daily, weekly and branch-level performance reports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
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
        <StatCard label="Weekly revenue" value={currency(1306000)} delta={9.2} icon={Banknote} hint="vs last week" />
        <StatCard label="Gross margin" value="31.4%" delta={1.8} icon={Percent} hint="after cost of sales" />
        <StatCard label="Orders" value="1,387" delta={4.4} icon={ShoppingBag} hint="avg 198 / day" />
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