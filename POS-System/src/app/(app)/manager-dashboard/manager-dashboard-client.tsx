"use client";

import { useMemo, useState } from "react";
import type { PosSale, viewBranches, viewManagerStats } from "@/db/queries/views";
import { Banknote, TrendingDown, Boxes, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { LiveClock } from "@/components/live-clock";
import { StatCard } from "@/components/stat-card";
import { DataTable, type Column } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionUser } from "@/components/session-provider";
import { useCurrency } from "@/components/currency-provider";

type Props = {
  stats: Awaited<ReturnType<typeof viewManagerStats>>;
  branchesData: Awaited<ReturnType<typeof viewBranches>>;
  sales: PosSale[];
};

export default function ManagerDashboardPage({ stats, branchesData, sales }: Props) {
  const user = useSessionUser();
  const { format: currency } = useCurrency();
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  // Managers are already scoped to their own branch by the query layer, so
  // this total — and the sales list below — only ever reflects what this
  // manager is actually allowed to see.
  const totalStaff = branchesData.reduce((sum, b) => sum + b.staff, 0);

  const [branchFilter, setBranchFilter] = useState("all");
  const filteredSales = useMemo(
    () => (branchFilter === "all" ? sales : sales.filter((s) => s.branch === branchFilter)),
    [sales, branchFilter],
  );

  const columns: Column<PosSale>[] = [
    { key: "time", header: "Time", render: (r) => <span className="text-muted-foreground">{r.time}</span> },
    { key: "id", header: "Receipt", render: (r) => <span className="num text-muted-foreground">{r.id}</span> },
    { key: "customer", header: "Customer", render: (r) => r.customer },
    { key: "items", header: "Items", align: "right", render: (r) => <span className="num">{r.items}</span> },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num font-medium">{currency(r.amount)}</span> },
    { key: "soldBy", header: "Sold by", render: (r) => r.cashier ?? "—" },
    { key: "branch", header: "Branch", render: (r) => r.branch ?? "—" },
    { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
  ];

  return (
    <AppShell
      title={`Welcome, ${firstName}`}
      subtitle={`Manager dashboard${user.branch ? ` · ${user.branch}` : ""}`}
      actions={<LiveClock />}
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales today" value={currency(stats.salesToday)} icon={Banknote} hint="Across your branches" />
        <StatCard label="Expenses today" value={currency(stats.expensesToday)} icon={TrendingDown} hint="Across your branches" />
        <StatCard label="Total products" value={String(stats.productCount)} icon={Boxes} hint={`${stats.lowStock} low`} />
        <StatCard label="Total staff" value={String(totalStaff)} icon={Users} hint="On payroll" />
      </section>

      <DataTable
        title="Recent sales"
        description={`${filteredSales.length} latest transaction${filteredSales.length === 1 ? "" : "s"}`}
        toolbar={
          branchesData.length > 1 ? (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-9 w-44 rounded-lg text-sm">
                <SelectValue placeholder="Filter branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branchesData.map((b) => (
                  <SelectItem key={b.id} value={b.name}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
        columns={columns}
        rows={filteredSales}
        minWidth={860}
      />
      {filteredSales.length === 0 && (
        <p className="text-sm text-muted-foreground">No sales recorded yet for this view.</p>
      )}
    </AppShell>
  );
}
