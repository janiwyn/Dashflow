import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Printer } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/pos-data";
import { employees, payrollRecords } from "@/lib/hr-data";

const searchSchema = z.object({ id: z.number().optional() });

export const Route = createFileRoute("/payroll-payslip")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Printable Payslip — Meridian POS" },
      { name: "description", content: "Full printable payslip including employee and branch information." },
      { property: "og:title", content: "Printable Payslip — Meridian POS" },
      { property: "og:description", content: "Full printable payslip including employee and branch information." },
    ],
  }),
  component: PayrollPayslipPage,
});

function PayrollPayslipPage() {
  const { id } = Route.useSearch();
  const record = payrollRecords.find((r) => r.id === id) ?? payrollRecords[0]!;
  const employee = employees.find((e) => e.id === record.employeeId);
  const deductions = record.nssf + record.tax + record.loan + record.otherDeductions;

  return (
    <AppShell
      title="Printable Payslip"
      subtitle={`${record.employee} · ${record.month}`}
      actions={<Button size="sm" className="rounded-lg"><Printer className="size-4" /> Print Payslip</Button>}
    >
      <div className="panel mx-auto max-w-3xl p-6">
        <div className="mb-6 border-b border-border pb-4 text-center">
          <h2 className="text-lg font-semibold">Employee Payslip</h2>
          <p className="text-sm text-muted-foreground">Month: {record.month}</p>
        </div>

        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Employee Information</h3>
            <p className="text-sm"><b>Name:</b> {record.employee}</p>
            <p className="text-sm"><b>Email:</b> {employee?.email ?? "—"}</p>
            <p className="text-sm"><b>Phone:</b> {employee?.phone ?? "—"}</p>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Employment Details</h3>
            <p className="text-sm"><b>Branch:</b> {employee?.branch ?? "—"}</p>
            <p className="text-sm"><b>Position:</b> {employee?.position ?? "—"}</p>
            <p className="text-sm"><b>Status:</b> {record.status}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <th className="py-2 text-left">Earnings</th>
              <th className="py-2 text-right">Amount</th>
              <th className="py-2 text-left pl-8">Deductions</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr><td className="py-1.5">Base Salary</td><td className="num py-1.5 text-right">{currency(record.baseSalary)}</td><td className="py-1.5 pl-8">NSSF</td><td className="num py-1.5 text-right">{currency(record.nssf)}</td></tr>
            <tr><td className="py-1.5">Transport</td><td className="num py-1.5 text-right">{currency(record.transport)}</td><td className="py-1.5 pl-8">Tax (PAYE)</td><td className="num py-1.5 text-right">{currency(record.tax)}</td></tr>
            <tr><td className="py-1.5">Housing</td><td className="num py-1.5 text-right">{currency(record.housing)}</td><td className="py-1.5 pl-8">Loan</td><td className="num py-1.5 text-right">{currency(record.loan)}</td></tr>
            <tr><td className="py-1.5">Medical</td><td className="num py-1.5 text-right">{currency(record.medical)}</td><td className="py-1.5 pl-8">Other Deductions</td><td className="num py-1.5 text-right">{currency(record.otherDeductions)}</td></tr>
            <tr><td className="py-1.5">Overtime</td><td className="num py-1.5 text-right">{currency(record.overtime)}</td><td className="py-1.5 pl-8"></td><td></td></tr>
          </tbody>
        </table>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm font-semibold">
          <div className="flex justify-between"><span>Gross Salary</span><span className="num">{currency(record.gross)}</span></div>
          <div className="flex justify-between"><span>Total Deductions</span><span className="num">{currency(deductions)}</span></div>
        </div>
        <div className="mt-4 flex justify-between rounded-lg bg-accent px-4 py-3 text-base font-semibold">
          <span>Net Salary</span>
          <span className="num">{currency(record.net)}</span>
        </div>
      </div>
    </AppShell>
  );
}