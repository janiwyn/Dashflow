"use client";

import Link from "next/link";
import { ArrowLeft, Banknote, TrendingDown, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import type {
  getBranchFinancials,
  getBranchStock,
  getBranchWorkers,
  getBranches,
} from "@/db/queries/branches";
import { currency } from "@/lib/format";

type Props = {
  branch: Awaited<ReturnType<typeof getBranches>>[number];
  fin: Awaited<ReturnType<typeof getBranchFinancials>>;
  stock: Awaited<ReturnType<typeof getBranchStock>>;
  workers: Awaited<ReturnType<typeof getBranchWorkers>>;
};

export default function BranchViewPage({ branch, fin, stock, workers }: Props) {
  return (

    <AppShell
      title={branch.name}
      subtitle={`${branch.location ?? "—"} · ${branch.contact ?? "—"}`}
      actions={
        <Link href="/list-branches">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="size-4" /> Back to branches
          </Button>
        </Link>
      }
    >
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total sales"
          value={currency(fin.totalSales)}
          icon={Banknote}
          hint="All time"
        />
        <StatCard
          label="Total expenses"
          value={currency(fin.totalExpenses)}
          icon={TrendingDown}
          hint="All time"
        />
        <StatCard
          label="Profit"
          value={currency(fin.profit)}
          icon={TrendingUp}
          hint={fin.profit >= 0 ? "Profitable" : "Loss making"}
        />
      </section>

      <DataTable
        title="Stock left"
        description="Remaining inventory at this branch"
        columns={[
          { key: "name", header: "Product", render: (r) => r.name },
          {
            key: "stockLeft",
            header: "Stock left",
            align: "right",
            render: (r) => <span className="num">{r.stockLeft}</span>,
          },
        ]}
        rows={stock}
      />

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
