import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/pos-data";
import { branchesData, branchFinancials, branchStock, branchWorkers } from "@/lib/branch-data";
import { Banknote, TrendingDown, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/branch-view")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: Number(search["id"]) || 1,
  }),
  head: () => ({
    meta: [
      { title: "Branch Overview — Meridian POS" },
      { name: "description", content: "Financial overview, stock and staff for a branch." },
      { property: "og:title", content: "Branch Overview — Meridian POS" },
      { property: "og:description", content: "Sales, expenses, profit, stock and staff for a branch." },
    ],
  }),
  component: BranchViewPage,
});

function BranchViewPage() {
  const { id } = Route.useSearch();
  const branch = branchesData.find((b) => b.id === id) ?? branchesData[0]!;
  const fin = branchFinancials[branch.id] ?? { totalSales: 0, totalExpenses: 0 };
  const profit = fin.totalSales - fin.totalExpenses;
  const stock = branchStock[branch.id] ?? [];
  const workers = branchWorkers[branch.id] ?? [];

  return (
    <AppShell
      title={branch.name}
      subtitle={`${branch.location} · ${branch.contact}`}
      actions={
        <Link to="/list-branches">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="size-4" /> Back to branches
          </Button>
        </Link>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total sales" value={currency(fin.totalSales)} icon={Banknote} hint="All time" />
        <StatCard label="Total expenses" value={currency(fin.totalExpenses)} icon={TrendingDown} hint="All time" />
        <StatCard
          label="Profit"
          value={currency(profit)}
          icon={TrendingUp}
          hint={profit >= 0 ? "Profitable" : "Loss making"}
        />
      </section>

      <DataTable
        title="Stock left"
        description="Remaining inventory at this branch"
        columns={[
          { key: "name", header: "Product", render: (r) => r.name },
          { key: "stockLeft", header: "Stock left", align: "right", render: (r) => <span className="num">{r.stockLeft}</span> },
        ]}
        rows={stock}
      />

      <DataTable
        title="Workers in this branch"
        description="Staff and managers assigned to this location"
        columns={[
          { key: "id", header: "#", render: (r) => <span className="num text-muted-foreground">{r.id}</span> },
          { key: "name", header: "Worker name", render: (r) => r.name },
          { key: "role", header: "Role", render: (r) => <span className="capitalize">{r.role}</span> },
          { key: "phone", header: "Phone", render: (r) => r.phone },
        ]}
        rows={workers}
      />
    </AppShell>
  );
}