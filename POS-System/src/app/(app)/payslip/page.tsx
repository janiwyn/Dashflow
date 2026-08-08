import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Printer } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getPayrollRecords } from "@/db/queries/hr";
import { getBusinessProfile } from "@/db/queries/profile";
import { formatMoney } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Payslip",
  description: "Downloadable payslip for an employee payroll record.",
};

export default async function PayslipPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const [records, business] = await Promise.all([getPayrollRecords(), getBusinessProfile()]);
  const currency = (n: number) => formatMoney(n, business?.currency);
  const record = (id ? records.find((r) => r.id === Number(id)) : null) ?? records[0];
  if (!record) notFound();

  const deductions = record.nssf + record.tax + record.loan + record.otherDeductions;
  const status = record.status === "paid" ? "Paid" : "Pending";

  const rows: [string, number][] = [
    ["Base Salary", record.baseSalary],
    ["Transport", record.transport],
    ["Housing", record.housing],
    ["Medical", record.medical],
    ["Overtime", record.overtime],
  ];
  const deductionRows: [string, number][] = [
    ["NSSF", record.nssf],
    ["Tax (PAYE)", record.tax],
    ["Loan", record.loan],
    ["Other Deductions", record.otherDeductions],
  ];

  return (
    <AppShell
      title="Employee Payslip"
      subtitle={`${record.employee} · ${record.month}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg">
            <Printer className="size-4" /> Print
          </Button>
          <Button size="sm" className="rounded-lg">
            <Download className="size-4" /> Download PDF
          </Button>
        </div>
      }
    >
      <div className="panel mx-auto max-w-2xl p-6">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold">Payslip</h2>
            <p className="text-sm text-muted-foreground">Meridian POS · {record.month}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === "Paid" ? "bg-success/12 text-success" : "bg-warning/12 text-warning"
            }`}
          >
            {status}
          </span>
        </div>
        <p className="mb-4">
          <span className="font-semibold">Employee:</span> {record.employee}
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Earnings
            </h3>
            {rows.map(([label, val]) => (
              <div
                key={label}
                className="flex justify-between border-b border-border py-1.5 text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="num">{currency(val)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 text-sm font-semibold">
              <span>Gross Salary</span>
              <span className="num">{currency(record.gross)}</span>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Deductions
            </h3>
            {deductionRows.map(([label, val]) => (
              <div
                key={label}
                className="flex justify-between border-b border-border py-1.5 text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="num">{currency(val)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 text-sm font-semibold">
              <span>Total Deductions</span>
              <span className="num">{currency(deductions)}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-between rounded-lg bg-accent px-4 py-3">
          <span className="text-base font-semibold">Net Salary</span>
          <span className="num text-base font-semibold">{currency(record.net)}</span>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Prefer the full printable view?{" "}
        <Link href={`/payroll-payslip?id=${record.id}`} className="underline">
          Open payroll payslip
        </Link>
      </p>
    </AppShell>
  );
}
