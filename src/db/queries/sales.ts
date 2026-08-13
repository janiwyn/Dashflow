import "server-only";

import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { branches, businesses, customers, products, saleItems, sales } from "@/db/schema";
import { label } from "@/lib/format";

import { businessScope, daysAgo, enforcedBranchId, num, startOfDay } from "./_helpers";

export type SaleRow = {
  id: number;
  reference: string;
  customer: string;
  customerId: number | null;
  branch: string | null;
  branchId: number | null;
  cashier: string | null;
  method: string;
  status: string;
  items: number;
  amount: number;
  soldAt: Date;
};

const saleSelect = {
  id: sales.id,
  reference: sales.reference,
  customer: sales.customerName,
  customerId: sales.customerId,
  branch: branches.name,
  branchId: sales.branchId,
  cashier: sales.cashierName,
  method: sales.method,
  status: sales.status,
  items: sql<number>`(select coalesce(sum(${saleItems}.quantity), 0) from ${saleItems} where ${saleItems}.sale_id = ${sales}.id)`,
  amount: sales.total,
  soldAt: sales.soldAt,
};

export async function getSales(options?: {
  limit?: number;
  branchId?: number;
  since?: Date;
  until?: Date;
}): Promise<SaleRow[]> {
  const businessId = await businessScope();
  const branchId = await enforcedBranchId(options?.branchId);
  const filters = [eq(sales.businessId, businessId)];
  if (branchId) filters.push(eq(sales.branchId, branchId));
  if (options?.since) filters.push(gte(sales.soldAt, options.since));
  if (options?.until) filters.push(lte(sales.soldAt, options.until));

  const rows = await db
    .select(saleSelect)
    .from(sales)
    .leftJoin(branches, eq(sales.branchId, branches.id))
    .where(and(...filters))
    .orderBy(desc(sales.soldAt))
    .limit(options?.limit ?? 100);

  return rows.map((r) => ({ ...r, items: num(r.items), amount: num(r.amount) }));
}

export async function getRecentSales(limit = 5) {
  return getSales({ limit });
}

/** Full receipt/invoice detail: header, seller, buyer and line items. */
export async function getSaleByReference(reference: string) {
  const businessId = await businessScope();

  const [sale] = await db
    .select({
      id: sales.id,
      reference: sales.reference,
      customerId: sales.customerId,
      customerName: sales.customerName,
      cashierName: sales.cashierName,
      branch: branches.name,
      method: sales.method,
      status: sales.status,
      subtotal: sales.subtotal,
      taxRate: sales.taxRate,
      taxAmount: sales.taxAmount,
      total: sales.total,
      amountPaid: sales.amountPaid,
      dueDate: sales.dueDate,
      soldAt: sales.soldAt,
    })
    .from(sales)
    .leftJoin(branches, eq(sales.branchId, branches.id))
    .where(and(eq(sales.businessId, businessId), eq(sales.reference, reference)))
    .limit(1);

  if (!sale) return null;

  const items = await db
    .select({
      id: saleItems.id,
      sku: saleItems.sku,
      name: saleItems.name,
      qty: saleItems.quantity,
      price: saleItems.unitPrice,
    })
    .from(saleItems)
    .where(eq(saleItems.saleId, sale.id));

  const [company] = await db
    .select({
      name: businesses.name,
      tagline: businesses.tagline,
      address: businesses.address,
      pin: businesses.taxPin,
      phone: businesses.phone,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const customer = sale.customerId
    ? (
        await db
          .select({ name: customers.name, email: customers.email, contact: customers.contact })
          .from(customers)
          .where(eq(customers.id, sale.customerId))
          .limit(1)
      )[0]
    : null;

  return {
    ...sale,
    subtotal: num(sale.subtotal),
    taxAmount: num(sale.taxAmount),
    total: num(sale.total),
    amountPaid: num(sale.amountPaid),
    items: items.map((i) => ({ ...i, price: num(i.price) })),
    company,
    customer: customer ?? { name: sale.customerName, email: null, contact: null },
  };
}

/** The most recent receipt — the receipt/invoice preview screens default to it. */
export async function getLatestSaleReference(): Promise<string | null> {
  const businessId = await businessScope();
  const [row] = await db
    .select({ reference: sales.reference })
    .from(sales)
    .where(eq(sales.businessId, businessId))
    .orderBy(desc(sales.soldAt))
    .limit(1);
  return row?.reference ?? null;
}

/** Daily totals for the trailing `days` window, oldest first. */
export async function getRevenueSeries(days = 7, branchId?: number) {
  const businessId = await businessScope();
  const scopedBranchId = await enforcedBranchId(branchId);
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - (days - 1));

  const filters = [
    eq(sales.businessId, businessId),
    gte(sales.soldAt, since),
    sql`${sales.status} <> 'refunded'`,
  ];
  if (scopedBranchId) filters.push(eq(sales.branchId, scopedBranchId));

  const rows = await db
    .select({
      date: sql<string>`to_char(${sales.soldAt}, 'YYYY-MM-DD')`,
      day: sql<string>`to_char(${sales.soldAt}, 'Dy')`,
      revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
      orders: count(sales.id),
    })
    .from(sales)
    .where(and(...filters))
    .groupBy(sql`to_char(${sales.soldAt}, 'YYYY-MM-DD')`, sql`to_char(${sales.soldAt}, 'Dy')`)
    .orderBy(sql`to_char(${sales.soldAt}, 'YYYY-MM-DD')`);

  return rows.map((r) => ({
    date: r.date,
    day: r.day.trim(),
    revenue: num(r.revenue),
    orders: num(r.orders),
  }));
}

/** Monthly totals for the period reports. */
export async function getMonthlyRevenue(months = 12) {
  const businessId = await businessScope();
  const rows = await db
    .select({
      month: sql<string>`to_char(${sales.soldAt}, 'Mon YYYY')`,
      key: sql<string>`to_char(${sales.soldAt}, 'YYYY-MM')`,
      revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
      orders: count(sales.id),
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        sql`${sales.soldAt} >= date_trunc('month', current_date) - ${`${months - 1} months`}::interval`,
        sql`${sales.status} <> 'refunded'`,
      ),
    )
    .groupBy(sql`to_char(${sales.soldAt}, 'Mon YYYY')`, sql`to_char(${sales.soldAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${sales.soldAt}, 'YYYY-MM')`);

  return rows.map((r) => ({ ...r, revenue: num(r.revenue), orders: num(r.orders) }));
}

/**
 * Gross margin for the trailing `days` window vs the window before it, using
 * each product's *current* buying price as the cost basis — sales don't
 * snapshot historical cost, so this is an approximation like most POS
 * systems make without a full cost-layer/FIFO ledger.
 */
export async function getGrossMarginTrend(days = 7) {
  const businessId = await businessScope();

  async function marginFor(since: Date, until?: Date) {
    const filters = [eq(sales.businessId, businessId), sql`${sales.status} <> 'refunded'`, gte(sales.soldAt, since)];
    if (until) filters.push(lte(sales.soldAt, until));

    const [row] = await db
      .select({
        revenue: sql<number>`coalesce(sum(${saleItems.quantity} * ${saleItems.unitPrice}), 0)`,
        cost: sql<number>`coalesce(sum(${saleItems.quantity} * ${products.buyingPrice}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(and(...filters));

    const revenue = num(row?.revenue);
    const cost = num(row?.cost);
    return revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
  }

  const currentSince = daysAgo(days - 1);
  const previousSince = daysAgo(days * 2 - 1);
  const previousUntil = new Date(currentSince.getTime() - 1);

  const [current, previous] = await Promise.all([marginFor(currentSince), marginFor(previousSince, previousUntil)]);

  return {
    marginPct: Math.round(current * 10) / 10,
    deltaPct: Math.round((current - previous) * 10) / 10,
  };
}

/** Best sellers by revenue, for the reports screens. */
export async function getTopProducts(options?: { limit?: number; branchId?: number; since?: Date; until?: Date }) {
  const businessId = await businessScope();
  const branchId = await enforcedBranchId(options?.branchId);
  const filters = [eq(sales.businessId, businessId), sql`${sales.status} <> 'refunded'`];
  if (branchId) filters.push(eq(sales.branchId, branchId));
  if (options?.since) filters.push(gte(sales.soldAt, options.since));
  if (options?.until) filters.push(lte(sales.soldAt, options.until));

  const rows = await db
    .select({
      name: saleItems.name,
      sku: saleItems.sku,
      units: sql<number>`sum(${saleItems.quantity})`,
      revenue: sql<number>`sum(${saleItems.quantity} * ${saleItems.unitPrice})`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(...filters))
    .groupBy(saleItems.name, saleItems.sku)
    .orderBy(desc(sql`sum(${saleItems.quantity} * ${saleItems.unitPrice})`))
    .limit(options?.limit ?? 5);

  return rows.map((r) => ({ ...r, units: num(r.units), revenue: num(r.revenue) }));
}

/** Raw payment-method totals for a window — unlike `getPaymentMix` (percentages, for the dashboard pie chart), this is for the report builder: real amounts, real date range, and correctly branch-enforced. */
export async function getPaymentBreakdown(options?: { branchId?: number; since?: Date; until?: Date }) {
  const businessId = await businessScope();
  const branchId = await enforcedBranchId(options?.branchId);
  const filters = [eq(sales.businessId, businessId), sql`${sales.status} <> 'refunded'`];
  if (branchId) filters.push(eq(sales.branchId, branchId));
  if (options?.since) filters.push(gte(sales.soldAt, options.since));
  if (options?.until) filters.push(lte(sales.soldAt, options.until));

  const rows = await db
    .select({
      method: sales.method,
      count: count(sales.id),
      total: sql<number>`coalesce(sum(${sales.total}), 0)`,
    })
    .from(sales)
    .where(and(...filters))
    .groupBy(sales.method)
    .orderBy(desc(sql`sum(${sales.total})`));

  return rows.map((r) => ({ ...r, count: num(r.count), total: num(r.total) }));
}

/** Headline figures for a day, plus the previous day for the delta chips. */
export async function getSalesTotals(branchId?: number) {
  const businessId = await businessScope();
  const scopedBranchId = await enforcedBranchId(branchId);
  const todayStart = startOfDay(new Date());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const filters = [eq(sales.businessId, businessId), sql`${sales.status} <> 'refunded'`];
  if (scopedBranchId) filters.push(eq(sales.branchId, scopedBranchId));

  const [row] = await db
    .select({
      todayRevenue: sql<number>`coalesce(sum(${sales.total}) filter (where ${sales.soldAt} >= ${todayStart}), 0)`,
      todayReceipts: sql<number>`count(*) filter (where ${sales.soldAt} >= ${todayStart})`,
      yesterdayRevenue: sql<number>`coalesce(sum(${sales.total}) filter (where ${sales.soldAt} >= ${yesterdayStart} and ${sales.soldAt} < ${todayStart}), 0)`,
      yesterdayReceipts: sql<number>`count(*) filter (where ${sales.soldAt} >= ${yesterdayStart} and ${sales.soldAt} < ${todayStart})`,
      weekRevenue: sql<number>`coalesce(sum(${sales.total}) filter (where ${sales.soldAt} >= current_date - 6), 0)`,
    })
    .from(sales)
    .where(and(...filters));

  const todayRevenue = num(row?.todayRevenue);
  const todayReceipts = num(row?.todayReceipts);

  return {
    todayRevenue,
    todayReceipts,
    yesterdayRevenue: num(row?.yesterdayRevenue),
    yesterdayReceipts: num(row?.yesterdayReceipts),
    weekRevenue: num(row?.weekRevenue),
    averageBasket: todayReceipts ? Math.round(todayRevenue / todayReceipts) : 0,
  };
}

const MIX_COLORS: Record<string, string> = {
  mpesa: "var(--color-chart-1)",
  cash: "var(--color-chart-2)",
  card: "var(--color-chart-3)",
  invoice: "var(--color-chart-4)",
  bank: "var(--color-chart-5)",
};

/** Share of takings by payment method, as whole percentages. */
export async function getPaymentMix(branchId?: number) {
  const businessId = await businessScope();
  const filters = [eq(sales.businessId, businessId), sql`${sales.status} <> 'refunded'`];
  if (branchId) filters.push(eq(sales.branchId, branchId));

  const rows = await db
    .select({
      method: sales.method,
      total: sql<number>`coalesce(sum(${sales.total}), 0)`,
    })
    .from(sales)
    .where(and(...filters))
    .groupBy(sales.method);

  const grand = rows.reduce((s, r) => s + num(r.total), 0);
  if (!grand) return [];

  return rows
    .map((r) => ({
      name: MIX_COLORS[r.method] ? label(r.method) : r.method,
      value: Math.round((num(r.total) / grand) * 100),
      color: MIX_COLORS[r.method] ?? "var(--color-chart-5)",
    }))
    .sort((a, b) => b.value - a.value);
}

/** Refund totals for a window, for the sales screen's refund tile. */
export async function getRefundTotals(days = 1) {
  const businessId = await businessScope();
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - (days - 1));

  const [row] = await db
    .select({
      amount: sql<number>`coalesce(sum(${sales.total}), 0)`,
      receipts: count(sales.id),
      pending: sql<number>`count(*) filter (where ${sales.status} = 'pending')`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        gte(sales.soldAt, since),
        sql`${sales.status} = 'refunded'`,
      ),
    );

  return { amount: num(row?.amount), receipts: num(row?.receipts) };
}

/** Pending receipt count for today. */
export async function getPendingReceiptCount() {
  const businessId = await businessScope();
  const [row] = await db
    .select({ pending: count(sales.id) })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        eq(sales.status, "pending"),
      ),
    );
  return num(row?.pending);
}

export type MySaleRow = {
  id: number;
  time: Date;
  reference: string;
  method: string;
  itemCount: number;
  total: number;
};

/** The signed-in cashier's own completed sales today, most recent first — what the staff dashboard shows instead of a fake recorder. */
export async function getMySalesToday(cashierId: string): Promise<MySaleRow[]> {
  const businessId = await businessScope();
  const todayStart = startOfDay(new Date());

  const rows = await db
    .select({
      id: sales.id,
      time: sales.soldAt,
      reference: sales.reference,
      method: sales.method,
      total: sales.total,
      itemCount: sql<number>`coalesce((
        select sum(${saleItems.quantity}) from ${saleItems} where ${saleItems.saleId} = ${sales.id}
      ), 0)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        eq(sales.cashierId, cashierId),
        gte(sales.soldAt, todayStart),
        sql`${sales.status} <> 'refunded'`,
      ),
    )
    .orderBy(desc(sales.soldAt))
    .limit(50);

  return rows.map((r) => ({ ...r, itemCount: num(r.itemCount), total: num(r.total) }));
}

/** Takings attributed to one cashier today. */
export async function getCashierTotals(cashierId: string) {
  const businessId = await businessScope();
  const todayStart = startOfDay(new Date());

  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
      receipts: count(sales.id),
      items: sql<number>`coalesce((
        select sum(${saleItems}.quantity) from ${saleItems}
        join ${sales} s2 on s2.id = ${saleItems}.sale_id
        where s2.cashier_id = ${cashierId} and s2.sold_at >= ${todayStart}
      ), 0)`,
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        eq(sales.cashierId, cashierId),
        gte(sales.soldAt, todayStart),
        sql`${sales.status} <> 'refunded'`,
      ),
    );

  return { revenue: num(row?.revenue), receipts: num(row?.receipts), items: num(row?.items) };
}
