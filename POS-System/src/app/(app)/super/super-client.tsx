"use client";

import type { viewBusinesses } from "@/db/queries/views";
import { Building2, Users, Boxes, ShoppingCart, Star, Settings } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import Link from "next/link";


const totalBranches = 18;
const totalManagers = 24;
const totalProducts = 3820;
const totalSales = 41260;
const pendingUpdates = 6;

type Props = {
  businesses: Awaited<ReturnType<typeof viewBusinesses>>;
};

export default function SuperDashboard({ businesses }: Props) {
  const activeSubscriptions = businesses.filter((b) => b.subscriptionStatus === "active").length;
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
          <Link href="/subscription" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            Manage subscriptions →
          </Link>
        </div>
        <div className="panel min-w-0 p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings className="size-4" />
            <p className="text-sm font-medium">System Updates Logged</p>
          </div>
          <p className="num mt-3 text-2xl font-semibold">{pendingUpdates}</p>
          <Link href="/system-updates" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            View logs →
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
