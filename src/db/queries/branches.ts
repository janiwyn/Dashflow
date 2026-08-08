import "server-only";

import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  branches,
  employees,
  expenses,
  products,
  sales,
  users,
} from "@/db/schema";

import { businessScope, enforcedBranchId, num, startOfDay } from "./_helpers";

export type BranchRow = {
  id: number;
  name: string;
  location: string | null;
  contact: string | null;
  manager: string | null;
  status: "open" | "closed";
  staff: number;
  todaySales: number;
};

/** Branch list with today's takings and headcount, used by every branch screen. */
export async function getBranches(): Promise<BranchRow[]> {
  const businessId = await businessScope();
  // A manager/staff account only ever sees the branch they're assigned to —
  // this covers every screen that lists branches (branch pages, HR/branch
  // filter dropdowns, the manager dashboard's branch card, etc.).
  const branchId = await enforcedBranchId();
  const todayStart = startOfDay(new Date());

  const where = branchId
    ? and(eq(branches.businessId, businessId), eq(branches.id, branchId))
    : eq(branches.businessId, businessId);

  const rows = await db
    .select({
      id: branches.id,
      name: branches.name,
      location: branches.location,
      contact: branches.contact,
      manager: branches.managerName,
      status: branches.status,
      staff: sql<number>`(
        select count(*) from ${employees}
        where ${employees}.branch_id = ${branches}.id
          and ${employees}.status = 'active'
      )`,
      todaySales: sql<number>`(
        select coalesce(sum(${sales}.total), 0) from ${sales}
        where ${sales}.branch_id = ${branches}.id
          and ${sales}.status <> 'refunded'
          and ${sales}.sold_at >= ${todayStart}
      )`,
    })
    .from(branches)
    .where(where)
    .orderBy(asc(branches.id));

  return rows.map((r) => ({ ...r, staff: num(r.staff), todaySales: num(r.todaySales) }));
}

export async function getBranchById(id: number): Promise<BranchRow | null> {
  const all = await getBranches();
  return all.find((b) => b.id === id) ?? null;
}

/** Simple name list for filter dropdowns, prefixed with an "All branches" option. */
export async function getBranchNames(): Promise<string[]> {
  const rows = await getBranches();
  return ["All branches", ...rows.map((b) => b.name)];
}

export async function getBranchStock(branchId: number) {
  const businessId = await businessScope();
  return db
    .select({
      id: products.id,
      name: products.name,
      stockLeft: products.stock,
      sellingPrice: products.sellingPrice,
    })
    .from(products)
    .where(and(eq(products.businessId, businessId), eq(products.branchId, branchId)))
    .orderBy(asc(products.name));
}

export async function getBranchWorkers(branchId: number) {
  const businessId = await businessScope();
  return db
    .select({
      id: employees.id,
      name: employees.name,
      role: sql<string>`coalesce(${users.role}, 'staff')`.as("role"),
      position: employees.position,
      phone: employees.phone,
      status: employees.status,
    })
    .from(employees)
    .leftJoin(users, eq(employees.userId, users.id))
    .where(and(eq(employees.businessId, businessId), eq(employees.branchId, branchId)))
    .orderBy(asc(employees.name));
}

export async function getBranchFinancials(branchId: number) {
  const businessId = await businessScope();

  const [salesRow] = await db
    .select({
      totalSales: sql<number>`coalesce(sum(${sales.total}), 0)`,
      receipts: count(sales.id),
    })
    .from(sales)
    .where(
      and(
        eq(sales.businessId, businessId),
        eq(sales.branchId, branchId),
        sql`${sales.status} <> 'refunded'`,
      ),
    );

  const [expenseRow] = await db
    .select({ totalExpenses: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(and(eq(expenses.businessId, businessId), eq(expenses.branchId, branchId)));

  const totalSales = num(salesRow?.totalSales);
  const totalExpenses = num(expenseRow?.totalExpenses);

  return {
    totalSales,
    totalExpenses,
    profit: totalSales - totalExpenses,
    receipts: num(salesRow?.receipts),
  };
}

/** Per-branch takings over a window — powers the branch comparison tables. */
export async function getBranchPerformance(days = 30) {
  const businessId = await businessScope();
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      branchId: branches.id,
      branch: branches.name,
      revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
      receipts: sql<number>`count(${sales.id})`,
    })
    .from(branches)
    .leftJoin(
      sales,
      and(
        eq(sales.branchId, branches.id),
        gte(sales.soldAt, since),
        sql`${sales.status} <> 'refunded'`,
      ),
    )
    .where(eq(branches.businessId, businessId))
    .groupBy(branches.id, branches.name)
    .orderBy(desc(sql`coalesce(sum(${sales.total}), 0)`));

  return rows.map((r) => ({ ...r, revenue: num(r.revenue), receipts: num(r.receipts) }));
}

export async function getStaffCount() {
  const businessId = await businessScope();
  const [row] = await db
    .select({ total: count(employees.id) })
    .from(employees)
    .where(and(eq(employees.businessId, businessId), eq(employees.status, "active")));
  return num(row?.total);
}
