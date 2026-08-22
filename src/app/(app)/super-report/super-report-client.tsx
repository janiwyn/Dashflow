"use client";

import { useMemo } from "react";
import type { viewAdmins, viewBusinessGrowth, viewBusinesses, viewPlatformSummary } from "@/db/queries/views";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Building2,
  CalendarPlus,
  CheckCircle2,
  Timer,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { formatMoney } from "@/lib/currency";
import { MODULE_CATALOG, MODULE_KEYS, MODULE_TILE_STYLE, modulesMonthlyTotal, type ModuleKey } from "@/lib/modules";

type Props = {
  businesses: Awaited<ReturnType<typeof viewBusinesses>>;
  admins: Awaited<ReturnType<typeof viewAdmins>>;
  businessGrowth: Awaited<ReturnType<typeof viewBusinessGrowth>>;
  summary: Awaited<ReturnType<typeof viewPlatformSummary>>;
  modules: Record<number, ModuleKey[]>;
};

export default function SuperReportPage({ businesses, admins, businessGrowth, summary, modules }: Props) {
  const total = businesses.length;
  const active = businesses.filter((b) => b.subscriptionStatus === "active").length;
  const pending = businesses.filter((b) => b.subscriptionStatus === "pending").length;
  const expired = businesses.filter((b) => b.subscriptionStatus === "expired").length;
  const totalAdmins = admins.length;
  const totalUsers = summary.users;
  const newThisMonth = businessGrowth.at(-1)?.added ?? 0;

  const platformMRR = useMemo(
    () => businesses.reduce((sum, b) => sum + modulesMonthlyTotal(modules[b.id] ?? []), 0),
    [businesses, modules],
  );

  const moduleAdoption = useMemo(() => {
    const counts = new Map<ModuleKey, number>(MODULE_KEYS.map((k) => [k, 0]));
    for (const keys of Object.values(modules)) {
      for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return MODULE_KEYS.map((key) => ({ key, count: counts.get(key) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [modules]);

  return (
    <AppShell title="System Reports & Analytics" subtitle="Platform-wide growth, subscription health and revenue across every business">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Businesses" value={String(total)} icon={Building2} hint={`${summary.branches} branches total`} />
        <StatCard label="New This Month" value={String(newThisMonth)} icon={CalendarPlus} hint="new registrations" />
        <StatCard label="Platform Users" value={String(totalUsers)} icon={Users} hint={`${totalAdmins} admins`} />
        <StatCard label="Platform MRR" value={formatMoney(platformMRR, "UGX")} icon={Wallet} hint="monthly recurring" />
        <StatCard label="Active Subscriptions" value={String(active)} icon={CheckCircle2} hint={`${total ? Math.round((active / total) * 100) : 0}% of businesses`} />
        <StatCard label="Pending" value={String(pending)} icon={Timer} hint="not yet activated" />
        <StatCard label="Expired" value={String(expired)} icon={AlertTriangle} hint="needs renewal" />
        <StatCard label="Admin Accounts" value={String(totalAdmins)} icon={UserCog} hint="business owners" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="panel min-w-0 p-5">
          <h2 className="text-base font-semibold">Cumulative business growth</h2>
          <p className="text-sm text-muted-foreground">Total registered businesses over time</p>
          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={businessGrowth} margin={{ left: -18, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <Tooltip
                  cursor={{ stroke: "var(--color-border)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                  formatter={(v) => [v, "Total businesses"]}
                />
                <Area type="monotone" dataKey="total" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#growth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel min-w-0 p-5">
          <h2 className="text-base font-semibold">New registrations</h2>
          <p className="text-sm text-muted-foreground">Businesses added per month</p>
          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={businessGrowth} margin={{ left: -18, right: 6, top: 6 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <Tooltip
                  cursor={{ fill: "var(--color-accent)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                  formatter={(v) => [v, "New businesses"]}
                />
                <Bar dataKey="added" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel min-w-0 p-5">
        <h2 className="text-base font-semibold">Module adoption</h2>
        <p className="text-sm text-muted-foreground">How many businesses subscribe to each module</p>
        <ul className="mt-5 flex flex-col gap-4">
          {moduleAdoption.map(({ key, count }) => {
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <li key={key} className="grid grid-cols-[220px_minmax(0,1fr)_auto] items-center gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-semibold ${MODULE_TILE_STYLE[key]}`}>
                    {MODULE_CATALOG[key].label.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate text-sm font-medium">{MODULE_CATALOG[key].label}</span>
                </span>
                <span className="h-2 min-w-0 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                  />
                </span>
                <span className="num shrink-0 text-xs text-muted-foreground">
                  {count} of {total} · {pct}%
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}
