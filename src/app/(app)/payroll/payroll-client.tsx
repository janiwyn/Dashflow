"use client";

import { useState } from "react";
import { Banknote, CheckCircle2, FileText, Wallet } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { currency } from "@/lib/format";
import type { PayrollRecord } from "@/db/queries/views";
import type { viewEmployees, viewPayrollRecords } from "@/db/queries/views";

type Props = {
  employees: Awaited<ReturnType<typeof viewEmployees>>;
  initialRecords: Awaited<ReturnType<typeof viewPayrollRecords>>;
};

const thisMonth = "2026-06";

export default function PayrollPage({ employees, initialRecords }: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [form, setForm] = useState({ transport: 0, housing: 0, medical: 0, overtime: 0, nssf: 0, tax: 0, loan: 0, other: 0 });

  const monthRecords = records.filter((r) => r.month === thisMonth);
  const totalGross = monthRecords.reduce((s, r) => s + r.gross, 0);
  const totalNet = monthRecords.reduce((s, r) => s + r.net, 0);

  function markPaid(id: number) {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Paid" } : r)));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const emp = employees.find((e2) => String(e2.id) === employeeId);
    if (!emp) return;
    const gross = emp.baseSalary + form.transport + form.housing + form.medical + form.overtime;
    const net = gross - (form.nssf + form.tax + form.loan + form.other);
    const rec: PayrollRecord = {
      id: records.length + 1,
      employeeId: emp.id,
      employee: emp.name,
      baseSalary: emp.baseSalary,
      transport: form.transport,
      housing: form.housing,
      medical: form.medical,
      overtime: form.overtime,
      nssf: form.nssf,
      tax: form.tax,
      loan: form.loan,
      otherDeductions: form.other,
      gross,
      net,
      month: thisMonth,
      status: "Pending",
    };
    setRecords([rec, ...records]);
    setEmployeeId("");
    setForm({ transport: 0, housing: 0, medical: 0, overtime: 0, nssf: 0, tax: 0, loan: 0, other: 0 });
  }

  const columns: Column<PayrollRecord>[] = [
    { key: "employee", header: "Employee", render: (r) => <span className="font-medium">{r.employee}</span> },
    { key: "gross", header: "Gross", align: "right", render: (r) => <span className="num">{currency(r.gross)}</span> },
    { key: "deductions", header: "Deductions", align: "right", render: (r) => <span className="num text-muted-foreground">{currency(r.nssf + r.tax + r.loan + r.otherDeductions)}</span> },
    { key: "net", header: "Net", align: "right", render: (r) => <span className="num font-semibold">{currency(r.net)}</span> },
    { key: "month", header: "Month", render: (r) => r.month },
    {
      key: "status", header: "Status",
      render: (r) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status === "Paid" ? "bg-success/12 text-success" : "bg-warning/12 text-warning"}`}>{r.status}</span>
      ),
    },
    {
      key: "actions", header: "", align: "right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          {r.status !== "Paid" && (
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => markPaid(r.id)}>
              <CheckCircle2 className="size-3.5" /> Mark Paid
            </Button>
          )}
          <Button asChild size="sm" variant="secondary" className="rounded-lg">
            <Link href={`/payslip?id=${r.id}`}><FileText className="size-3.5" /> Payslip</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Payroll Management" subtitle={`${thisMonth} payroll cycle`}>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total gross (month)" value={currency(totalGross)} icon={Banknote} hint={thisMonth} />
        <StatCard label="Total net (month)" value={currency(totalNet)} icon={Wallet} hint="after deductions" />
        <StatCard label="Records" value={String(monthRecords.length)} icon={FileText} hint="this month" />
      </section>

      <form onSubmit={handleSave} className="panel grid gap-3 p-5">
        <h2 className="text-base font-semibold">Add Payroll Record</h2>
        <div className="grid gap-1.5 sm:max-w-sm">
          <Label>Select Employee</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder="-- Choose Employee --" /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name} — {currency(e.baseSalary)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["transport", "housing", "medical", "overtime"] as const).map((f) => (
            <div key={f} className="grid gap-1.5">
              <Label className="capitalize">{f}</Label>
              <Input type="number" value={form[f]} onChange={(e) => setForm({ ...form, [f]: Number(e.target.value) })} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="grid gap-1.5"><Label>NSSF</Label><Input type="number" value={form.nssf} onChange={(e) => setForm({ ...form, nssf: Number(e.target.value) })} /></div>
          <div className="grid gap-1.5"><Label>Tax (PAYE)</Label><Input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} /></div>
          <div className="grid gap-1.5"><Label>Loan</Label><Input type="number" value={form.loan} onChange={(e) => setForm({ ...form, loan: Number(e.target.value) })} /></div>
          <div className="grid gap-1.5"><Label>Other Deductions</Label><Input type="number" value={form.other} onChange={(e) => setForm({ ...form, other: Number(e.target.value) })} /></div>
        </div>
        <div>
          <Button type="submit" className="rounded-lg" disabled={!employeeId}>Save Payroll</Button>
        </div>
      </form>

      <DataTable title="Payroll records" description="All months, newest first" columns={columns} rows={records} minWidth={900} />
    </AppShell>
  );
}
