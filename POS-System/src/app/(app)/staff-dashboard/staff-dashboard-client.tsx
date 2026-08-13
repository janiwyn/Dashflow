"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Banknote, Package, Receipt, ScanBarcode } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MyAttendanceCard } from "@/components/attendance/my-attendance-card";
import { LiveClock } from "@/components/live-clock";
import { StatCard } from "@/components/stat-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/components/session-provider";
import { useCurrency } from "@/components/currency-provider";
import { label } from "@/lib/format";
import type { getOwnEmployeeRecord } from "@/db/queries/attendance";
import type { MySaleRow } from "@/db/queries/sales";
import type { viewStaffStats } from "@/db/queries/views";

type Props = {
  stats: Awaited<ReturnType<typeof viewStaffStats>>;
  mySales: MySaleRow[];
  attendanceEnabled: boolean;
  ownEmployee: Awaited<ReturnType<typeof getOwnEmployeeRecord>>;
  ownToday: { clockIn: Date | null; clockOut: Date | null } | null;
};

const timeFmt = (d: Date) =>
  new Date(d).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });

const columns = (currency: (n: number) => string): Column<MySaleRow>[] => [
  { key: "time", header: "Time", render: (r) => <span className="text-muted-foreground">{timeFmt(r.time)}</span> },
  { key: "reference", header: "Receipt", render: (r) => <span className="num text-muted-foreground">{r.reference}</span> },
  { key: "method", header: "Method", render: (r) => label(r.method) },
  { key: "items", header: "Items", align: "right", render: (r) => <span className="num">{r.itemCount}</span> },
  { key: "total", header: "Total", align: "right", render: (r) => <span className="num font-semibold">{currency(r.total)}</span> },
];

export default function StaffDashboardPage({ stats, mySales, attendanceEnabled, ownEmployee, ownToday }: Props) {
  const router = useRouter();
  const user = useSessionUser();
  const { format: currency } = useCurrency();
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const saleColumns = columns(currency);

  return (
    <AppShell
      title={`Welcome, ${firstName}`}
      subtitle={`Staff dashboard${user.branch ? ` · ${user.branch}` : ""}`}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <LiveClock />
          <Button asChild className="rounded-lg">
            <Link href="/pos"><ScanBarcode className="size-4" /> Open sales terminal</Link>
          </Button>
        </div>
      }
    >
      {attendanceEnabled && (
        <MyAttendanceCard ownEmployee={ownEmployee} ownToday={ownToday} onDone={() => router.refresh()} />
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My sales today" value={currency(stats.revenue)} icon={Banknote} hint={`${stats.receipts} receipts`} />
        <StatCard label="Items sold today" value={String(stats.items)} icon={Package} hint="Across all products" />
        <StatCard label="Receipts issued" value={String(stats.receipts)} icon={Receipt} hint="Today" />
      </section>

      <DataTable
        title="My sales today"
        description="Every receipt you've rung up today, most recent first"
        columns={saleColumns}
        rows={mySales}
        minWidth={640}
      />
      {mySales.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nothing yet — head to the{" "}
          <Link href="/pos" className="font-medium text-primary hover:underline">
            sales terminal
          </Link>{" "}
          to ring up your first sale today.
        </p>
      )}
    </AppShell>
  );
}
