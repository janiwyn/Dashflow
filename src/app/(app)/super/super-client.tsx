"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Briefcase,
  Building2,
  Package,
  Plus,
  Sparkles,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
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

import type { viewBusinessGrowth, viewBusinesses, viewPlatformSummary, viewSystemLogs } from "@/db/queries/views";
import { AppShell } from "@/components/app-shell";
import { LiveClock } from "@/components/live-clock";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/components/session-provider";
import { MODULE_KEYS, modulesMonthlyTotal, type ModuleKey } from "@/lib/modules";
import { annualPrice, isPlanKey, PLAN_LIST } from "@/lib/plans";

type Props = {
  summary: Awaited<ReturnType<typeof viewPlatformSummary>>;
  growth: Awaited<ReturnType<typeof viewBusinessGrowth>>;
  businesses: Awaited<ReturnType<typeof viewBusinesses>>;
  activity: Awaited<ReturnType<typeof viewSystemLogs>>;
  modules: Record<number, ModuleKey[]>;
};

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function StatusBadge({ status }: { status: "active" | "suspended" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "active" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
      }`}
    >
      {status === "active" ? "Active" : "Suspended"}
    </span>
  );
}

/** "2026-08-20 14:23:11 - [Super Admin] Uploaded update file: x.zip" -> parts for a cleaner row. */
function splitLogLine(line: string) {
  const match = line.match(/^(\S+ \S+) - \[(.+?)\] (.+)$/);
  if (!match) return { time: "", actor: "", message: line };
  const [, timestamp, actor, message] = match;
  return { time: timestamp.slice(5).replace("T", " "), actor, message };
}

const PLAN_CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];
const A_LA_CARTE_COLOR = "var(--color-muted-foreground)";

function HealthBar({ label, pct, hint }: { label: string; pct: number; hint: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="num font-semibold">{pct}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function SuperDashboard({ summary, growth, businesses, activity, modules }: Props) {
  const user = useSessionUser();

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const title = now ? `${greetingFor(now.getHours())}, ${firstName}` : "Super Admin Dashboard";
  const dateLabel = now
    ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : "";
  const subtitle = dateLabel ? `${dateLabel} · Platform-wide overview` : "Platform-wide overview";

  const latestGrowth = growth.at(-1);
  const recentBusinesses = useMemo(() => [...businesses].reverse().slice(0, 5), [businesses]);

  const subscriptionMix = useMemo(() => {
    const active = businesses.filter((b) => b.subscriptionStatus === "active").length;
    const pending = businesses.filter((b) => b.subscriptionStatus === "pending").length;
    const expired = businesses.filter((b) => b.subscriptionStatus === "expired").length;
    return [
      { name: "Active", value: active, color: "var(--color-success)" },
      { name: "Pending", value: pending, color: "var(--color-warning)" },
      { name: "Expired", value: expired, color: "var(--color-destructive)" },
    ];
  }, [businesses]);
  const subscriptionTotal = subscriptionMix.reduce((sum, s) => sum + s.value, 0);

  const planDistribution = useMemo(() => {
    const counts = new Map(PLAN_LIST.map((p) => [p.key, 0]));
    const mrr = new Map(PLAN_LIST.map((p) => [p.key, 0]));
    let aLaCarteCount = 0;
    let aLaCarteMrr = 0;
    for (const b of businesses) {
      if (isPlanKey(b.planKey)) {
        counts.set(b.planKey, (counts.get(b.planKey) ?? 0) + 1);
        const plan = PLAN_LIST.find((p) => p.key === b.planKey)!;
        if (plan.monthlyPrice !== null) {
          const cost = b.billingPeriod === "annual" ? Math.round(annualPrice(plan.monthlyPrice) / 12) : plan.monthlyPrice;
          mrr.set(b.planKey, (mrr.get(b.planKey) ?? 0) + cost);
        }
      } else {
        aLaCarteCount += 1;
        aLaCarteMrr += modulesMonthlyTotal(modules[b.id] ?? []);
      }
    }
    return [
      ...PLAN_LIST.map((p, i) => ({
        name: p.label,
        businesses: counts.get(p.key) ?? 0,
        mrr: mrr.get(p.key) ?? 0,
        color: PLAN_CHART_COLORS[i % PLAN_CHART_COLORS.length],
      })),
      { name: "À la carte", businesses: aLaCarteCount, mrr: aLaCarteMrr, color: A_LA_CARTE_COLOR },
    ];
  }, [businesses, modules]);

  const health = useMemo(() => {
    const total = businesses.length || 1;
    const activeSubs = businesses.filter((b) => b.subscriptionStatus === "active").length;
    const goodStanding = businesses.filter((b) => b.status === "active").length;
    const avgModules =
      businesses.reduce((sum, b) => sum + (modules[b.id]?.length ?? 0), 0) / (total * MODULE_KEYS.length);
    return {
      activeSubsPct: Math.round((activeSubs / total) * 100),
      goodStandingPct: Math.round((goodStanding / total) * 100),
      avgModulesPct: Math.round(avgModules * 100),
    };
  }, [businesses, modules]);

  const insight = useMemo(() => {
    const current = growth.at(-1)?.added ?? 0;
    const previous = growth.at(-2)?.added ?? 0;
    // A percentage swing off a tiny previous-month count (e.g. 1 -> 15 reads
    // as "+1400%") is technically correct but misleading — state the real
    // counts instead once the baseline is too small for a % to mean anything.
    if (previous < 5) {
      if (current === 0) return "No new business registrations yet this month.";
      return `${current} new business${current === 1 ? "" : "es"} joined the platform this month, up from ${previous} last month.`;
    }
    const change = Math.round(((current - previous) / previous) * 100);
    if (change >= 0) return `New business registrations are up ${change}% compared to last month — momentum is building.`;
    return `New business registrations are down ${Math.abs(change)}% compared to last month.`;
  }, [growth]);

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <LiveClock />
          <Button asChild size="sm" className="rounded-lg">
            <Link href="/add-business">
              <Plus className="size-4" /> Add business
            </Link>
          </Button>
        </div>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Businesses"
          value={String(summary.total)}
          icon={Building2}
          hint={`${summary.active} active · ${summary.suspended} suspended`}
          sparkline={growth.map((g) => g.total)}
        />
        <StatCard label="Total Branches" value={String(summary.branches)} icon={Briefcase} hint="across all businesses" />
        <StatCard
          label="Platform Users"
          value={summary.users.toLocaleString()}
          icon={UsersRound}
          hint={`${summary.admins} admins · ${summary.managers} managers`}
        />
        <StatCard label="Total Sales" value={summary.sales.toLocaleString()} icon={ShoppingCart} hint="lifetime receipts" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="panel min-w-0 p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
                <h2 className="truncate text-base font-semibold">Business growth</h2>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">New registrations over time</p>
            </div>
            <p className="num shrink-0 text-lg font-semibold">
              +{latestGrowth?.added ?? 0}
              <span className="ml-1 text-xs font-normal text-muted-foreground">this month</span>
            </p>
          </div>
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ left: -18, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="biz" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                />
                <Tooltip
                  cursor={{ stroke: "var(--color-border)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                  formatter={(v, key) => [v, key === "total" ? "Total businesses" : "New this month"]}
                />
                <Area type="monotone" dataKey="total" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#biz)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel min-w-0 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
            <h2 className="truncate text-base font-semibold">Subscription health</h2>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{subscriptionTotal} businesses by status</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={subscriptionMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={2} stroke="none">
                    {subscriptionMix.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="min-w-0 flex-1 space-y-2.5">
              {subscriptionMix.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="truncate text-muted-foreground">{s.name}</span>
                  </span>
                  <span className="num shrink-0 font-semibold">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="panel min-w-0 p-5">
        <div className="flex items-center gap-2">
          <Package className="size-4 shrink-0 text-muted-foreground" />
          <h2 className="truncate text-base font-semibold">Plan distribution</h2>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">How many businesses are on each package, and what it's worth</p>
        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={planDistribution} margin={{ left: -18, right: 6, top: 6 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <Tooltip
                cursor={{ fill: "var(--color-accent)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  fontSize: 12,
                }}
                formatter={(value, key, item) => {
                  if (key === "businesses") {
                    const mrr = (item.payload as { mrr: number }).mrr;
                    return [`${value} · ${new Intl.NumberFormat("en-UG").format(mrr)} UGX/mo`, "Businesses"];
                  }
                  return [value, key];
                }}
              />
              <Bar dataKey="businesses" radius={[6, 6, 0, 0]} maxBarSize={64}>
                {planDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="panel min-w-0 p-5">
          <div className="flex min-w-0 items-center gap-2">
            <Activity className="size-4 shrink-0 text-muted-foreground" />
            <h2 className="truncate text-base font-semibold">Recent activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No system activity logged yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {activity.map((line, i) => {
                const { time, message } = splitLogLine(line);
                return (
                  <li key={i} className="py-3">
                    <p className="truncate text-sm font-medium">{message}</p>
                    {time && <p className="num mt-0.5 truncate text-xs text-muted-foreground">{time}</p>}
                  </li>
                );
              })}
            </ul>
          )}
          <Button asChild variant="secondary" size="sm" className="mt-4 w-full rounded-lg">
            <Link href="/system-updates">View all logs</Link>
          </Button>
        </div>

        <div className="panel min-w-0 p-5">
          <h2 className="text-base font-semibold">Platform health</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Real-time indicators across every business</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <HealthBar label="Active subscriptions" pct={health.activeSubsPct} hint="of all businesses" />
            <HealthBar label="Good standing" pct={health.goodStandingPct} hint="not suspended" />
            <HealthBar label="Module adoption" pct={health.avgModulesPct} hint="avg. of 9 modules" />
          </div>
        </div>
      </section>

      <section className="panel min-w-0 overflow-hidden border-l-4 border-l-primary bg-gradient-to-r from-accent/60 to-transparent p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Platform insight</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{insight}</p>
          </div>
          <Button asChild size="sm" className="shrink-0 rounded-lg">
            <Link href="/super-report">
              View full report <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="panel min-w-0 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">Recently registered businesses</h2>
            <p className="truncate text-sm text-muted-foreground">Newest tenants on the platform</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-lg">
            <Link href="/manage-business">View all</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Business</th>
                <th className="px-5 py-3 font-semibold">Admin</th>
                <th className="px-5 py-3 font-semibold">Registered</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">
                    No businesses registered yet.
                  </td>
                </tr>
              ) : (
                recentBusinesses.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-5 py-3 font-medium">{b.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {b.adminName ?? <em>No admin yet</em>}
                    </td>
                    <td className="num px-5 py-3 text-muted-foreground">{b.dateRegistered}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
