"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/components/currency-provider";
import type { viewBranches } from "@/db/queries/views";

type Props = {
  branchesData: Awaited<ReturnType<typeof viewBranches>>;
};

type ReportType = "expenses" | "total_expenses" | "debtors" | "payment_analysis" | "product_summary" | "sales";

const reportTypes: { value: ReportType; label: string }[] = [
  { value: "expenses", label: "Expenses report" },
  { value: "total_expenses", label: "Total expenses report" },
  { value: "sales", label: "Sales report" },
  { value: "debtors", label: "Debtors report" },
  { value: "payment_analysis", label: "Payment method analysis" },
  { value: "product_summary", label: "Product summary report" },
];

const dataByType: Record<ReportType, { columns: { key: string; header: string; align?: "right" }[]; rows: Record<string, string | number>[] }> = {
  expenses: {
    columns: [
      { key: "id", header: "ID" },
      { key: "date", header: "Date" },
      { key: "supplier", header: "Supplier" },
      { key: "branch", header: "Branch" },
      { key: "category", header: "Category" },
      { key: "amount", header: "Amount", align: "right" },
      { key: "spentBy", header: "Spent by" },
    ],
    rows: [
      { id: "EXP-3391", date: "01 Jun 2026", supplier: "Highland Coffee Ltd", branch: "Nairobi — Main", category: "Rent", amount: "KSh 145,000", spentBy: "James Kariuki" },
      { id: "EXP-3392", date: "04 Jun 2026", supplier: "KPLC", branch: "Nairobi — Main", category: "Utilities", amount: "KSh 23,400", spentBy: "James Kariuki" },
      { id: "EXP-3393", date: "07 Jun 2026", supplier: "Shell Kenya", branch: "Mombasa — Nyali", category: "Logistics", amount: "KSh 18,700", spentBy: "Aisha Said" },
    ],
  },
  total_expenses: {
    columns: [
      { key: "date", header: "Date" },
      { key: "branch", header: "Branch" },
      { key: "count", header: "Expenses" },
      { key: "total", header: "Total", align: "right" },
    ],
    rows: [
      { date: "01 Jun 2026", branch: "Nairobi — Main", count: 4, total: "KSh 251,600" },
      { date: "04 Jun 2026", branch: "Mombasa — Nyali", count: 2, total: "KSh 42,500" },
    ],
  },
  sales: {
    columns: [
      { key: "date", header: "Date" },
      { key: "branch", header: "Branch" },
      { key: "product", header: "Product" },
      { key: "quantity", header: "Qty" },
      { key: "total", header: "Total", align: "right" },
      { key: "soldBy", header: "Sold by" },
    ],
    rows: [
      { date: "05 Aug 2026", branch: "Nairobi — Main", product: "Arabica Beans 1kg", quantity: 3, total: "KSh 5,550", soldBy: "Peter Mwangi" },
      { date: "05 Aug 2026", branch: "Kisumu — Oginga", product: "Green Tea 100 bags", quantity: 5, total: "KSh 2,700", soldBy: "Brian Ochieng" },
    ],
  },
  debtors: {
    columns: [
      { key: "date", header: "Date" },
      { key: "name", header: "Debtor" },
      { key: "item", header: "Item taken" },
      { key: "balance", header: "Balance", align: "right" },
      { key: "status", header: "Status" },
    ],
    rows: [
      { date: "03 Aug 2026", name: "Riverside Cafe", item: "Assorted groceries", balance: "KSh 26,400", status: "Unpaid" },
      { date: "28 Jul 2026", name: "Halima Yusuf", item: "Cooking oil, sugar", balance: "KSh 1,200", status: "Unpaid" },
    ],
  },
  payment_analysis: {
    columns: [
      { key: "date", header: "Date" },
      { key: "method", header: "Payment method" },
      { key: "amount", header: "Amount", align: "right" },
    ],
    rows: [
      { date: "05 Aug 2026", method: "M-Pesa", amount: "KSh 155,600" },
      { date: "05 Aug 2026", method: "Cash", amount: "KSh 72,300" },
      { date: "05 Aug 2026", method: "Card", amount: "KSh 24,100" },
    ],
  },
  product_summary: {
    columns: [
      { key: "date", header: "Date" },
      { key: "product", header: "Product" },
      { key: "sold", header: "Items sold", align: "right" },
    ],
    rows: [
      { date: "05 Aug 2026", product: "Arabica Beans 1kg", sold: 24 },
      { date: "05 Aug 2026", product: "Fresh Milk 500ml", sold: 96 },
    ],
  },
};

export default function ReportsGeneratorPage({ branchesData }: Props) {
  const { format: currency } = useCurrency();
  const [type, setType] = useState<ReportType>("expenses");
  const [branch, setBranch] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const report = dataByType[type];
  const branchName = branch === "all" ? "All Branches" : branchesData.find((b) => String(b.id) === branch)?.name ?? "All Branches";

  return (
    <AppShell
      title="Report Generator"
      subtitle="Build custom reports across expenses, sales and debtors"
      actions={
        <Button variant="outline" size="sm" className="rounded-lg">
          <FileDown className="size-4" /> Export
        </Button>
      }
    >
      <div className="panel min-w-0 p-5">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label>Report type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Branch</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branchesData.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date-from">Date from</Label>
            <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date-to">Date to</Label>
            <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg" />
          </div>
        </div>
      </div>

      <DataTable
        title={reportTypes.find((t) => t.value === type)?.label ?? "Report"}
        description={`Period: ${dateFrom || "…"} to ${dateTo || "…"} · Branch: ${branchName}`}
        columns={report.columns.map((c) => ({
          key: c.key,
          header: c.header,
          align: c.align === "right" ? ("right" as const) : ("left" as const),
          render: (r: Record<string, string | number>) => r[c.key] ?? "",
        }))}
        rows={report.rows}
      />
    </AppShell>
  );
}
