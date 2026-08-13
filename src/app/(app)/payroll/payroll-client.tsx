"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Banknote, CheckCircle2, FileText, RefreshCw, Wallet } from "lucide-react";

import { generateMonthlyPayroll, setPayrollStatus, upsertPayrollRecord } from "@/app/actions/hr";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/components/currency-provider";
import type { PayrollRecord } from "@/db/queries/views";
import type { viewEmployees, viewPayrollRecords } from "@/db/queries/views";

type Props = {
  employees: Awaited<ReturnType<typeof viewEmployees>>;
  initialRecords: Awaited<ReturnType<typeof viewPayrollRecords>>;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const emptyForm = { transport: 0, housing: 0, medical: 0, overtime: 0, nssf: 0, tax: 0, loan: 0, other: 0 };

export default function PayrollPage({ employees, initialRecords }: Props) {
  const { format: currency } = useCurrency();
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [employeeId, setEmployeeId] = useState<string>("");
  const [form, setForm] = useState(emptyForm);
  const [saving, startSaving] = useTransition();
  const [generating, startGenerating] = useTransition();
  const [marking, startMarking] = useTransition();

  const monthRecords = useMemo(() => initialRecords.filter((r) => r.month === month), [initialRecords, month]);
  const totalGross = monthRecords.reduce((s, r) => s + r.gross, 0);
  const totalNet = monthRecords.reduce((s, r) => s + r.net, 0);

  const markPaid = (id: number) => {
    startMarking(async () => {
      const result = await setPayrollStatus(id, "paid");
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e2) => String(e2.id) === employeeId);
    if (!emp) {
      toast.error("Select an employee first.");
      return;
    }
    startSaving(async () => {
      const result = await upsertPayrollRecord({
        employeeId: emp.id,
        month,
        baseSalary: emp.baseSalary,
        transport: form.transport,
        housing: form.housing,
        medical: form.medical,
        overtime: form.overtime,
        nssf: form.nssf,
        tax: form.tax,
        loan: form.loan,
        otherDeductions: form.other,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setEmployeeId("");
      setForm(emptyForm);
      router.refresh();
    });
  };

  const generate = () => {
    startGenerating(async () => {
      const result = await generateMonthlyPayroll(month);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

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
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => markPaid(r.id)} disabled={marking}>
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
    <AppShell title="Payroll Management" subtitle={`${month} payroll cycle`}>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total gross (month)" value={currency(totalGross)} icon={Banknote} hint={month} />
        <StatCard label="Total net (month)" value={currency(totalNet)} icon={Wallet} hint="after deductions" />
        <StatCard label="Records" value={String(monthRecords.length)} icon={FileText} hint="this month" />
      </section>

      <div className="panel flex flex-wrap items-end justify-between gap-4 p-5">
        <div className="grid gap-1.5">
          <Label>Pay period</Label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44 rounded-lg" />
        </div>
        <Button variant="outline" className="rounded-lg" onClick={generate} disabled={generating}>
          <RefreshCw className="size-4" /> {generating ? "Generating…" : `Generate payroll for ${month}`}
        </Button>
      </div>

      <form onSubmit={handleSave} className="panel grid gap-3 p-5">
        <h2 className="text-base font-semibold">Add / Update Payroll Record</h2>
        <p className="text-xs text-muted-foreground">Saving again for the same employee and month updates that record instead of duplicating it.</p>
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
          <Button type="submit" className="rounded-lg" disabled={!employeeId || saving}>{saving ? "Saving…" : "Save Payroll"}</Button>
        </div>
      </form>

      <DataTable title="Payroll records" description="All months, newest first" columns={columns} rows={initialRecords} minWidth={900} />
    </AppShell>
  );
}
