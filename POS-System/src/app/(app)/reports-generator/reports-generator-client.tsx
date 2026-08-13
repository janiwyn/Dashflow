"use client";

import { useMemo, useState, useTransition } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

import { generateReport, type ReportFilters, type ReportResult, type ReportType } from "@/app/actions/reports";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
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
  initialResult: ReportResult;
};

const reportTypes: { value: ReportType; label: string }[] = [
  { value: "expenses", label: "Expenses report" },
  { value: "total_expenses", label: "Total expenses report" },
  { value: "sales", label: "Sales report" },
  { value: "debtors", label: "Debtors report" },
  { value: "payment_analysis", label: "Payment method analysis" },
  { value: "product_summary", label: "Product summary report" },
];

type Row = Record<string, unknown>;

function buildTable(
  result: ReportResult,
  currency: (n: number) => string,
): { columns: Column<Row>[]; rows: Row[]; csvHeaders: string[]; csvRows: (string | number | null)[][] } {
  switch (result.type) {
    case "expenses":
      return {
        columns: [
          { key: "id", header: "Ref", render: (r) => <span className="num text-muted-foreground">{r.id as string}</span> },
          { key: "date", header: "Date", render: (r) => r.date as string },
          { key: "branch", header: "Branch", render: (r) => r.branch as string },
          { key: "category", header: "Category", render: (r) => r.category as string },
          { key: "label", header: "Description", render: (r) => r.label as string },
          { key: "spentBy", header: "Spent by", render: (r) => r.spentBy as string },
          { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num font-medium">{currency(r.amount as number)}</span> },
        ],
        rows: result.rows,
        csvHeaders: ["Ref", "Date", "Branch", "Category", "Description", "Spent by", "Amount"],
        csvRows: result.rows.map((r) => [r.id, r.date, r.branch, r.category, r.label, r.spentBy, r.amount]),
      };

    case "total_expenses":
      return {
        columns: [
          { key: "date", header: "Date", render: (r) => r.date as string },
          { key: "branch", header: "Branch", render: (r) => r.branch as string },
          { key: "count", header: "Expenses", align: "right", render: (r) => <span className="num">{r.count as number}</span> },
          { key: "total", header: "Total", align: "right", render: (r) => <span className="num font-semibold">{currency(r.total as number)}</span> },
        ],
        rows: result.rows,
        csvHeaders: ["Date", "Branch", "Expenses", "Total"],
        csvRows: result.rows.map((r) => [r.date, r.branch, r.count, r.total]),
      };

    case "sales":
      return {
        columns: [
          { key: "reference", header: "Receipt", render: (r) => <span className="num text-muted-foreground">{r.reference as string}</span> },
          { key: "date", header: "Date", render: (r) => r.date as string },
          { key: "branch", header: "Branch", render: (r) => r.branch as string },
          { key: "customer", header: "Customer", render: (r) => r.customer as string },
          { key: "items", header: "Items", align: "right", render: (r) => <span className="num">{r.items as number}</span> },
          { key: "method", header: "Method", render: (r) => r.method as string },
          { key: "soldBy", header: "Sold by", render: (r) => r.soldBy as string },
          { key: "amount", header: "Total", align: "right", render: (r) => <span className="num font-semibold">{currency(r.amount as number)}</span> },
        ],
        rows: result.rows,
        csvHeaders: ["Receipt", "Date", "Branch", "Customer", "Items", "Method", "Sold by", "Total"],
        csvRows: result.rows.map((r) => [r.reference, r.date, r.branch, r.customer, r.items, r.method, r.soldBy, r.amount]),
      };

    case "debtors":
      return {
        columns: [
          { key: "date", header: "Date", render: (r) => r.date as string },
          { key: "name", header: "Debtor", render: (r) => r.name as string },
          { key: "itemTaken", header: "Item taken", render: (r) => r.itemTaken as string },
          { key: "balance", header: "Balance", align: "right", render: (r) => <span className="num font-semibold text-destructive">{currency(r.balance as number)}</span> },
          { key: "status", header: "Status", render: (r) => r.status as string },
        ],
        rows: result.rows,
        csvHeaders: ["Date", "Debtor", "Item taken", "Balance", "Status"],
        csvRows: result.rows.map((r) => [r.date, r.name, r.itemTaken, r.balance, r.status]),
      };

    case "payment_analysis":
      return {
        columns: [
          { key: "method", header: "Payment method", render: (r) => r.method as string },
          { key: "count", header: "Transactions", align: "right", render: (r) => <span className="num">{r.count as number}</span> },
          { key: "amount", header: "Amount", align: "right", render: (r) => <span className="num font-semibold">{currency(r.amount as number)}</span> },
        ],
        rows: result.rows,
        csvHeaders: ["Payment method", "Transactions", "Amount"],
        csvRows: result.rows.map((r) => [r.method, r.count, r.amount]),
      };

    case "product_summary":
      return {
        columns: [
          { key: "product", header: "Product", render: (r) => r.product as string },
          { key: "sku", header: "SKU", render: (r) => <span className="num text-muted-foreground">{r.sku as string}</span> },
          { key: "unitsSold", header: "Units sold", align: "right", render: (r) => <span className="num">{r.unitsSold as number}</span> },
          { key: "revenue", header: "Revenue", align: "right", render: (r) => <span className="num font-semibold">{currency(r.revenue as number)}</span> },
        ],
        rows: result.rows,
        csvHeaders: ["Product", "SKU", "Units sold", "Revenue"],
        csvRows: result.rows.map((r) => [r.product, r.sku, r.unitsSold, r.revenue]),
      };
  }
}

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const cell = (v: string | number | null) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))].join("\r\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsGeneratorPage({ branchesData, initialResult }: Props) {
  const { format: currency } = useCurrency();
  const [type, setType] = useState<ReportType>("expenses");
  const [branch, setBranch] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState<ReportResult>(initialResult);
  const [generating, startGenerating] = useTransition();

  const branchName = branch === "all" ? "All branches" : branchesData.find((b) => String(b.id) === branch)?.name ?? "All branches";

  const generate = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.error("'Date from' must be before 'Date to'.");
      return;
    }
    const filters: ReportFilters = {
      branchId: branch === "all" ? undefined : Number(branch),
      from: dateFrom || undefined,
      to: dateTo || undefined,
    };
    startGenerating(async () => {
      const next = await generateReport(type, filters);
      setResult(next);
    });
  };

  const table = useMemo(() => buildTable(result, currency), [result, currency]);

  const exportCsv = () => {
    if (table.rows.length === 0) {
      toast.error("Nothing to export — generate a report with results first.");
      return;
    }
    const label = reportTypes.find((t) => t.value === result.type)?.label ?? "report";
    downloadCsv(`${label.replace(/\s+/g, "-").toLowerCase()}-${dateFrom || "all"}-${dateTo || "time"}.csv`, toCsv(table.csvHeaders, table.csvRows));
  };

  return (
    <AppShell
      title="Report Generator"
      subtitle="Build custom reports across expenses, sales, debtors and payments"
      actions={
        <Button variant="outline" size="sm" className="rounded-lg" onClick={exportCsv}>
          <FileDown className="size-4" /> Export CSV
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
        <Button onClick={generate} disabled={generating} className="mt-4 rounded-lg">
          {generating ? "Generating…" : "Generate report"}
        </Button>
      </div>

      <DataTable
        title={reportTypes.find((t) => t.value === result.type)?.label ?? "Report"}
        description={`Period: ${dateFrom || "all time"} to ${dateTo || "now"} · Branch: ${branchName} · ${table.rows.length} row${table.rows.length === 1 ? "" : "s"}`}
        columns={table.columns}
        rows={table.rows}
        minWidth={840}
      />
      {table.rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No records match these filters.</p>
      )}
    </AppShell>
  );
}
