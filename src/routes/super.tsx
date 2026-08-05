import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, Boxes, ShoppingCart, Star, Settings } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { businesses } from "@/lib/super-admin-data";

export const Route = createFileRoute("/super")({
  head: () => ({
    meta: [
      { title: "Super Admin Dashboard — Meridian POS" },
      { name: "description", content: "System-wide overview of businesses, managers, products, sales and subscriptions." },
      { property: "og:title", content: "Super Admin Dashboard — Meridian POS" },
      { property: "og:description", content: "System-wide overview across every tenant business." },
    ],
  }),
  component: SuperDashboard,
});

const totalBranches = 18;
const totalManagers = 24;
const totalProducts = 3820;
const totalSales = 41260;
const activeSubscriptions = businesses.filter((b) => b.subscriptionStatus === "active").length;
const pendingUpdates = 6;

function SuperDashboard() {
  return (
    <AppShell title="Super Admin Dashboard" subtitle="System-wide overview across all registered businesses">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Branches" value={String(totalBranches)} icon={Building2} hint="across all businesses" />
        <StatCard label="Total Managers" value={String(totalManagers)} icon={Users} hint="active role: manager" />
        <StatCard label="Total Products" value={totalProducts.toLocaleString()} icon={Boxes} hint="catalog wide" />
        <StatCard label="Total Sales" value={totalSales.toLocaleString()} icon={ShoppingCart} hint="lifetime receipts" />
        <div className="panel min-w-0 p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="size-4" />
            <p className="text-sm font-medium">Active Subscriptions</p>
          </div>
          <p className="num mt-3 text-2xl font-semibold">{activeSubscriptions}</p>
          <Link to="/subscription" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            Manage subscriptions →
          </Link>
        </div>
        <div className="panel min-w-0 p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings className="size-4" />
            <p className="text-sm font-medium">System Updates Logged</p>
          </div>
          <p className="num mt-3 text-2xl font-semibold">{pendingUpdates}</p>
          <Link to="/system-updates" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            View logs →
          </Link>
        </div>
      </section>
    </AppShell>
  );
}