"use server";

import {
  viewDebtorReport,
  viewExpenseReport,
  viewPaymentBreakdownReport,
  viewProductSummaryReport,
  viewSalesReport,
} from "@/db/queries/views";
import { requireRole } from "@/lib/session";

export type ReportType = "expenses" | "total_expenses" | "sales" | "debtors" | "payment_analysis" | "product_summary";

export type ReportFilters = { branchId?: number; from?: string; to?: string };

export type TotalExpenseRow = { date: string; branch: string; count: number; total: number };

export type ReportResult =
  | { type: "expenses"; rows: Awaited<ReturnType<typeof viewExpenseReport>> }
  | { type: "total_expenses"; rows: TotalExpenseRow[] }
  | { type: "sales"; rows: Awaited<ReturnType<typeof viewSalesReport>> }
  | { type: "debtors"; rows: Awaited<ReturnType<typeof viewDebtorReport>> }
  | { type: "payment_analysis"; rows: Awaited<ReturnType<typeof viewPaymentBreakdownReport>> }
  | { type: "product_summary"; rows: Awaited<ReturnType<typeof viewProductSummaryReport>> };

/** Builds one of the report builder's six real reports — dispatches on type, all filters actually applied at the query layer. */
export async function generateReport(type: ReportType, filters: ReportFilters): Promise<ReportResult> {
  await requireRole("super", "admin", "manager");

  switch (type) {
    case "expenses":
      return { type: "expenses", rows: await viewExpenseReport(filters) };

    case "total_expenses": {
      const rows = await viewExpenseReport(filters);
      const grouped = new Map<string, TotalExpenseRow>();
      for (const r of rows) {
        const key = `${r.date}|${r.branch}`;
        const existing = grouped.get(key) ?? { date: r.date, branch: r.branch, count: 0, total: 0 };
        existing.count += 1;
        existing.total += r.amount;
        grouped.set(key, existing);
      }
      return { type: "total_expenses", rows: Array.from(grouped.values()) };
    }

    case "sales":
      return { type: "sales", rows: await viewSalesReport(filters) };

    case "debtors":
      return { type: "debtors", rows: await viewDebtorReport(filters) };

    case "payment_analysis":
      return { type: "payment_analysis", rows: await viewPaymentBreakdownReport(filters) };

    case "product_summary":
      return { type: "product_summary", rows: await viewProductSummaryReport(filters) };
  }
}
