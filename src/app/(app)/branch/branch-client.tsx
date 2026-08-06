"use client";

import { Banknote, TrendingDown, TrendingUp, Users } from "lucide-react";
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
import { DataTable } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  getBranchFinancials,
  getBranchWorkers,
  getBranches,
} from "@/db/queries/branches";
import type { getPaymentMix, getRevenueSeries } from "@/db/queries/sales";
import { currency } from "@/lib/format";

type Props = {
  branch: Awaited<ReturnType<typeof getBranches>>[number];
  branches: Awaited<ReturnType<typeof getBranches>>;
  fin: Awaited<ReturnType<typeof getBranchFinancials>>;
  workers: Awaited<ReturnType<typeof getBranchWorkers>>;
  revenueSeries: Awaited<ReturnType<typeof getRevenueSeries>>;
  paymentMix: Awaited<ReturnType<typeof getPaymentMix>>;
};

export default function BranchPage({
  branch,
  branches,
  fin,
  workers,
  revenueSeries,
  paymentMix,
}: Props) {
  return (
    <AppShell
      title="Branch Dashboard"
      subtitle={`${branch.location ?? "—"} · ${branch.contact ?? "—"}`}
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-lg">
              Viewing: {branch.name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {branches.map((b) => (
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
        <StatCard
          label="Expenses"
          value={currency(fin.totalExpenses)}
          icon={TrendingDown}
          hint="All time"
        />
        <StatCard
          label="Profit"
          value={currency(fin.profit)}
          icon={TrendingUp}
          hint={fin.profit >= 0 ? "Profitable" : "Loss"}
        />
        <StatCard
          label="Staff"
          value={String(workers.length)}
          icon={Users}
          hint="Assigned to branch"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="panel min-w-0 p-5">
          <h2 className="text-base font-semibold">Revenue trend</h2>
          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries} margin={{ left: -20, right: 6, top: 6 }}>
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
                  width={54}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                  formatter={(v) => currency(Number(v))}
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
                  <Pie
                    data={paymentMix}
                    dataKey="value"
                    innerRadius={40}
                    outerRadius={68}
                    paddingAngle={2}
                  >
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
          {
            key: "role",
            header: "Role",
            render: (r) => <span className="capitalize">{r.role}</span>,
          },
          { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
        ]}
        rows={workers}
      />
    </AppShell>
  );
}
