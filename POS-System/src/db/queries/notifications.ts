import "server-only";

import { and, asc, desc, eq, isNotNull, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { branches, customers, debtors, products, smsLogs } from "@/db/schema";

import { businessScope, num } from "./_helpers";

export async function getSmsLogs() {
  const businessId = await businessScope();
  return db
    .select({
      id: smsLogs.id,
      recipient: smsLogs.recipient,
      message: smsLogs.message,
      status: smsLogs.status,
      sentAt: smsLogs.sentAt,
    })
    .from(smsLogs)
    .where(eq(smsLogs.businessId, businessId))
    .orderBy(desc(smsLogs.sentAt));
}

/** Products at or under their reorder point. */
export async function getLowStockAlerts() {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      branch: branches.name,
      stock: products.stock,
      price: products.sellingPrice,
    })
    .from(products)
    .leftJoin(branches, eq(products.branchId, branches.id))
    .where(and(eq(products.businessId, businessId), lte(products.stock, products.lowStockThreshold)))
    .orderBy(asc(products.stock));

  return rows.map((r) => ({ ...r, price: num(r.price) }));
}

/** Dated stock inside the expiry warning window. */
export async function getExpiryAlerts(days = 30) {
  const businessId = await businessScope();
  return db
    .select({
      id: products.id,
      name: products.name,
      branch: branches.name,
      stock: products.stock,
      expiryDate: products.expiryDate,
    })
    .from(products)
    .leftJoin(branches, eq(products.branchId, branches.id))
    .where(
      and(
        eq(products.businessId, businessId),
        isNotNull(products.expiryDate),
        lte(products.expiryDate, sql`current_date + ${days}::int`),
      ),
    )
    .orderBy(asc(products.expiryDate));
}

/** Shop debtors past their due date. */
export async function getShopDebtorAlerts() {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: debtors.id,
      name: debtors.name,
      branch: branches.name,
      dueDate: debtors.dueDate,
      balance: debtors.balance,
    })
    .from(debtors)
    .leftJoin(branches, eq(debtors.branchId, branches.id))
    .where(and(eq(debtors.businessId, businessId), sql`${debtors.balance} > 0`))
    .orderBy(asc(debtors.dueDate));

  return rows.map((r) => ({ ...r, balance: num(r.balance) }));
}

/** Account customers carrying an outstanding balance. */
export async function getCustomerDebtorAlerts() {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      dueDate: customers.openingDate,
      balance: customers.accountBalance,
    })
    .from(customers)
    .where(and(eq(customers.businessId, businessId), sql`${customers.accountBalance} > 0`))
    .orderBy(desc(customers.accountBalance));

  return rows.map((r) => ({ ...r, balance: num(r.balance) }));
}

/** One call for the notification centre, which renders all four groups. */
export async function getNotificationCentre() {
  const [lowStock, expiring, shopDebtors, customerDebtors] = await Promise.all([
    getLowStockAlerts(),
    getExpiryAlerts(),
    getShopDebtorAlerts(),
    getCustomerDebtorAlerts(),
  ]);

  return {
    lowStock,
    expiring,
    shopDebtors,
    customerDebtors,
    total: lowStock.length + expiring.length + shopDebtors.length + customerDebtors.length,
  };
}
