"use client";

import type { viewAdmins, viewBusinessGrowth, viewBusinesses } from "@/db/queries/views";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, CheckCircle2, AlertTriangle, UserCog, Users, CalendarPlus } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";


type Props = {
  businesses: Awaited<ReturnType<typeof viewBusinesses>>;
  admins: Awaited<ReturnType<typeof viewAdmins>>;
  businessGrowth: Awaited<ReturnType<typeof viewBusinessGrowth>>;
};

export default function SuperReportPage({ businesses, admins, businessGrowth }: Props) {
  const total = businesses.length;
  const active = businesses.filter((b) => b.subscriptionStatus === "active").length;
  const expired = businesses.filter((b) => b.subscriptionStatus === "expired").length;
  const totalAdmins = admins.length;
  const totalUsers = admins.length + 32;
  const newThisMonth = 2;


  return (
    <AppShell title="System Reports & Analytics" subtitle="Platform-wide performance across all businesses">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Businesses" value={String(total)} icon={Building2} />
        <StatCard label="Active Subscriptions" value={String(active)} icon={CheckCircle2} />
        <StatCard label="Expired Subscriptions" value={String(expired)} icon={AlertTriangle} />
        <StatCard label="Admin Accounts" value={String(totalAdmins)} icon={UserCog} />
        <StatCard label="Total Users" value={String(totalUsers)} icon={Users} />
        <StatCard label="New This Month" value={String(newThisMonth)} icon={CalendarPlus} />
      </section>

      <section className="panel min-w-0 p-5">
        <h2 className="text-base font-semibold">Business Growth (Monthly)</h2>
        <p className="text-sm text-muted-foreground">New businesses registered per month</p>
        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={businessGrowth} margin={{ left: -18, right: 6, top: 6 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="total" name="New businesses" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </AppShell>
  );
}
