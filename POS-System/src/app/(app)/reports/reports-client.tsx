"use client";

import { useMemo } from "react";
import type {
  viewIncomeStatementSummary,
  viewMonthlyRevenueTrend,
  viewReportStats,
  viewRevenueSeries,
  viewSalesAnalytics,
} from "@/db/queries/views";
import { Banknote, CalendarCheck, PiggyBank, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
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
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-provider";

type Props = {
  stats: Awaited<ReturnType<typeof viewReportStats>>;
  revenueSeries: Awaited<ReturnType<typeof viewRevenueSeries>>;
  monthlyTrend: Awaited<ReturnType<typeof viewMonthlyRevenueTrend>>;
  analytics: Awaited<ReturnType<typeof viewSalesAnalytics>>;
  income: Awaited<ReturnType<typeof viewIncomeStatementSummary>> | null;
  subtitle: string;
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

function DonutPanel({
  title,
  subtitle,
  data,
  valueFormatter,
}: {
  title: string;
  subtitle?: string;
  data: { name: string; value: number }[];
  valueFormatter: (v: number) => string;
}) {
  return (
    <ChartPanel title={title} subtitle={subtitle}>
      {data.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <div className="flex h-full items-center gap-4">
          <div className="h-full w-1/2 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="85%" paddingAngle={2} stroke="none">
                  {data.map((entry, i) => (
                    <Cell key={entry.name} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }}
                  formatter={(v) => valueFormatter(Number(v))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="min-w-0 flex-1 space-y-2 overflow-y-auto">
            {data.map((d, i) => (
              <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                  <span className="truncate text-muted-foreground">{d.name}</span>
                </span>
                <span className="num shrink-0 font-medium">{valueFormatter(d.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartPanel>
  );
}

export default function ReportsPage({ stats, monthlyTrend, analytics, income, subtitle }: Props) {
  const { format: currency } = useCurrency();

  const totalRevenue30d = useMemo(() => analytics.byCategory.reduce((s, c) => s + c.revenue, 0), [analytics.byCategory]);

  const growth = useMemo(() => {
    const current = monthlyTrend.at(-1);
    const previous = monthlyTrend.at(-2);
    if (!current || !previous || previous.revenue < 1) return null;
    return Math.round(((current.revenue - previous.revenue) / previous.revenue) * 100);
  }, [monthlyTrend]);

  const tooltipStyle = {
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    fontSize: 12,
  };

  return (
    <AppShell
      title="Reports"
      subtitle={subtitle}
      actions={
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => window.print()}>
          Download PDF
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Revenue" value={currency(totalRevenue30d)} icon={Banknote} hint="last 30 days" />
        {income ? (
          <>
            <StatCard label="Total expenses" value={currency(income.totalExpenses)} icon={Receipt} hint="last 30 days" />
            <StatCard label="Net profit" value={currency(income.netProfit)} icon={PiggyBank} hint="after expenses" />
          </>
        ) : (
          <StatCard label="Gross margin" value={`${stats.marginPct}%`} delta={stats.marginDeltaPct} icon={PiggyBank} hint="after cost of sales" />
        )}
        <StatCard label="Orders" value={String(stats.orders)} icon={ShoppingBag} hint={`avg ${stats.averagePerDay} / day`} />
        <StatCard
          label="Revenue growth"
          value={growth === null ? "—" : `${growth >= 0 ? "+" : ""}${growth}%`}
          icon={TrendingUp}
          hint="vs previous month"
        />
        <StatCard label="Best day" value={stats.bestDay.day} icon={CalendarCheck} hint={currency(stats.bestDay.revenue)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ChartPanel title="Revenue trend" subtitle="Monthly, last 6 months">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} margin={{ left: -18, right: 6, top: 6 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={60}
                domain={[0, (max: number) => Math.ceil((max * 1.15) / 500000) * 500000]}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              />
              <Tooltip cursor={{ fill: "var(--color-accent)" }} contentStyle={tooltipStyle} formatter={(v) => currency(Number(v))} />
              <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} maxBarSize={80} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <DonutPanel
          title="Sales by category"
          subtitle="Revenue share, last 30 days"
          data={analytics.byCategory.map((c) => ({ name: c.name, value: c.revenue }))}
          valueFormatter={currency}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Revenue by branch" subtitle="Last 30 days">
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

        <ChartPanel title="Top products" subtitle="By revenue, last 30 days">
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
      </section>

      {income && (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <DonutPanel
            title="Expense breakdown"
            subtitle="By category, last 30 days"
            data={income.expenses.map((e) => ({ name: e.category, value: e.amount }))}
            valueFormatter={currency}
          />

          <div className="panel min-w-0 p-5">
            <h2 className="text-base font-semibold">Profit &amp; loss summary</h2>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Revenue" value={currency(income.revenue)} />
              <Row label="Cost of sales" value={`− ${currency(income.costOfSales)}`} muted />
              <Row label="Gross profit" value={currency(income.grossProfit)} strong />
              <Row label="Total expenses" value={`− ${currency(income.totalExpenses)}`} muted />
              <div className="border-t border-border pt-2.5">
                <Row label="Net profit" value={currency(income.netProfit)} strong large />
              </div>
            </dl>
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Row({ label, value, muted, strong, large }: { label: string; value: string; muted?: boolean; strong?: boolean; large?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <dt className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</dt>
      <dd className={`num ${strong ? "font-semibold" : ""} ${large ? "text-lg" : ""}`}>{value}</dd>
    </div>
  );
}
