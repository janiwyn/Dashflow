import { createFileRoute } from "@tanstack/react-router";
import { Banknote, TrendingDown, Boxes, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currency } from "@/lib/pos-data";
import { branchesData } from "@/lib/branch-data";

export const Route = createFileRoute("/manager-dashboard")({
  head: () => ({
    meta: [
      { title: "Manager Dashboard — Meridian POS" },
      { name: "description", content: "Daily sales, expenses and recent transactions for branch managers." },
      { property: "og:title", content: "Manager Dashboard — Meridian POS" },
      { property: "og:description", content: "Track today's performance across your branch." },
    ],
  }),
  component: ManagerDashboardPage,
});

const recentSales = [
  { date: "05 Aug 14:12", product: "Arabica Beans 1kg", quantity: 3, amount: 5550, soldBy: "Peter Mwangi", branch: "Nairobi — Main" },
  { date: "05 Aug 13:58", product: "Fresh Milk 500ml", quantity: 12, amount: 780, soldBy: "Grace Otieno", branch: "Nairobi — Main" },
  { date: "05 Aug 13:20", product: "Rice Pishori 5kg", quantity: 2, amount: 2580, soldBy: "Halima Yusuf", branch: "Mombasa — Nyali" },
  { date: "05 Aug 12:44", product: "Detergent 2L", quantity: 4, amount: 2480, soldBy: "Peter Mwangi", branch: "Nairobi — Main" },
  { date: "05 Aug 11:59", product: "Green Tea 100 bags", quantity: 5, amount: 2700, soldBy: "Brian Ochieng", branch: "Kisumu — Oginga" },
];

function ManagerDashboardPage() {
  return (
    <AppShell title="Welcome, James Kariuki" subtitle="Manager dashboard · Nairobi — Main branch">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales today" value={currency(84200)} icon={Banknote} hint="Across your branches" />
        <StatCard label="Expenses today" value={currency(18400)} icon={TrendingDown} hint="Across your branches" />
        <StatCard label="Total products" value="142" icon={Boxes} hint="In stock" />
        <StatCard label="Total staff" value="30" icon={Users} hint="On payroll" />
      </section>

      <DataTable
        title="Recent sales"
        description="Latest transactions across all your branches"
        toolbar={
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-44 rounded-lg text-sm">
              <SelectValue placeholder="Filter branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branchesData.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        columns={[
          { key: "date", header: "Date", render: (r) => <span className="text-muted-foreground">{r.date}</span> },
          { key: "product", header: "Product", render: (r) => r.product },
          { key: "quantity", header: "Qty", align: "right", render: (r) => <span className="num">{r.quantity}</span> },
          { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num font-medium">{currency(r.amount)}</span> },
          { key: "soldBy", header: "Sold by", render: (r) => r.soldBy },
          { key: "branch", header: "Branch", render: (r) => r.branch },
        ]}
        rows={recentSales}
      />
    </AppShell>
  );
}
