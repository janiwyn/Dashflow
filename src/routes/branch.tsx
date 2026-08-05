import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, TrendingDown, TrendingUp, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { currency, revenueSeries } from "@/lib/pos-data";
import { branchesData, branchFinancials, branchWorkers } from "@/lib/branch-data";

export const Route = createFileRoute("/branch")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: Number(search["id"]) || 1,
  }),
  head: () => ({
    meta: [
      { title: "Branch Dashboard — Meridian POS" },
      { name: "description", content: "Branch-level financial overview with sales trend and payment mix." },
      { property: "og:title", content: "Branch Dashboard — Meridian POS" },
      { property: "og:description", content: "Sales, expenses and payment mix for a single branch." },
    ],
  }),
  component: BranchPage,
});

const paymentMix = [
  { name: "M-Pesa", value: 58, color: "var(--color-chart-1)" },
  { name: "Cash", value: 27, color: "var(--color-chart-2)" },
  { name: "Card", value: 9, color: "var(--color-chart-3)" },
  { name: "Invoice", value: 6, color: "var(--color-chart-4)" },
];

function BranchPage() {
  const { id } = Route.useSearch();
  const branch = branchesData.find((b) => b.id === id) ?? branchesData[0]!;
  const fin = branchFinancials[branch.id] ?? { totalSales: 0, totalExpenses: 0 };
  const workers = branchWorkers[branch.id] ?? [];
  const profit = fin.totalSales - fin.totalExpenses;

  return (
    <AppShell
      title="Branch Dashboard"
      subtitle={`${branch.location} · ${branch.contact}`}
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-lg">
              Viewing: {branch.name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {branchesData.map((b) => (
              <DropdownMenuItem key={b.id} asChild>
                <a href={`/branch?id=${b.id}`}>{b.name}</a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales" value={currency(fin.totalSales)} icon={Banknote} hint="All time" />
        <StatCard label="Expenses" value={currency(fin.totalExpenses)} icon={TrendingDown} hint="All time" />
        <StatCard label="Profit" value={currency(profit)} icon={TrendingUp} hint={profit >= 0 ? "Profitable" : "Loss"} />
        <StatCard label="Staff" value={String(workers.length)} icon={Users} hint="Assigned to branch" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="panel min-w-0 p-5">
          <h2 className="text-base font-semibold">Revenue trend</h2>
          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries} margin={{ left: -20, right: 6, top: 6 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} width={54} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)", fontSize: 12 }}
                  formatter={(v: number) => currency(v)}
                />
                <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel min-w-0 p-5">
          <h2 className="text-base font-semibold">Payment mix</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMix} dataKey="value" innerRadius={40} outerRadius={68} paddingAngle={2}>
                    {paymentMix.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {paymentMix.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-sm" style={{ background: p.color }} />
                    {p.name}
                  </span>
                  <span className="num text-muted-foreground">{p.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <DataTable
        title="Branch staff"
        description="Workers assigned to this branch"
        columns={[
          { key: "name", header: "Name", render: (r) => r.name },
          { key: "role", header: "Role", render: (r) => <span className="capitalize">{r.role}</span> },
          { key: "phone", header: "Phone", render: (r) => r.phone },
        ]}
        rows={workers}
      />
    </AppShell>
  );
}