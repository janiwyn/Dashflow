import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { branches, customers, saleItems, sales } from "@/db/schema";

import { businessScope, num } from "./_helpers";

export type CustomerRow = {
  id: number;
  name: string;
  type: string;
  contact: string | null;
  email: string | null;
  orders: number;
  spend: number;
  balance: number;
};

export async function getCustomers(): Promise<CustomerRow[]> {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      type: customers.type,
      contact: customers.contact,
      email: customers.email,
      orders: sql<number>`(select count(*) from ${sales} where ${sales}.customer_id = ${customers}.id)`,
      spend: sql<number>`(select coalesce(sum(${sales}.total), 0) from ${sales} where ${sales}.customer_id = ${customers}.id and ${sales}.status <> 'refunded')`,
      balance: customers.accountBalance,
    })
    .from(customers)
    .where(eq(customers.businessId, businessId))
    .orderBy(desc(customers.accountBalance));

  return rows.map((r) => ({
    ...r,
    orders: num(r.orders),
    spend: num(r.spend),
    balance: num(r.balance),
  }));
}

export async function getCustomerCount() {
  const businessId = await businessScope();
  const [row] = await db
    .select({ total: count(customers.id) })
    .from(customers)
    .where(eq(customers.businessId, businessId));
  return num(row?.total);
}

/** Customer file: profile plus their transaction history. */
export async function getCustomerFile(id?: number) {
  const businessId = await businessScope();

  const [profile] = await db
    .select()
    .from(customers)
    .where(
      id
        ? and(eq(customers.businessId, businessId), eq(customers.id, id))
        : eq(customers.businessId, businessId),
    )
    .orderBy(desc(customers.accountBalance))
    .limit(1);

  if (!profile) return null;

  const transactions = await db
    .select({
      id: sales.id,
      date: sales.soldAt,
      branch: branches.name,
      ref: sales.reference,
      products: sql<string>`(
        select string_agg(${saleItems}.name || ' x' || ${saleItems}.quantity, ', ')
        from ${saleItems} where ${saleItems}.sale_id = ${sales}.id
      )`,
      total: sales.total,
      paid: sales.amountPaid,
      status: sales.status,
    })
    .from(sales)
    .leftJoin(branches, eq(sales.branchId, branches.id))
    .where(and(eq(sales.businessId, businessId), eq(sales.customerId, profile.id)))
    .orderBy(desc(sales.soldAt))
    .limit(25);

  return {
    profile: {
      ...profile,
      accountBalance: num(profile.accountBalance),
      amountCredited: num(profile.amountCredited),
    },
    transactions: transactions.map((t) => {
      const total = num(t.total);
      const paid = num(t.paid);
      return {
        ...t,
        products: t.products ?? "—",
        total,
        paid,
        credited: Math.max(total - paid, 0),
      };
    }),
  };
}
