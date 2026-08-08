import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  branches,
  debtorPayments,
  debtors,
  paymentProofs,
  products,
  remoteOrderItems,
  remoteOrders,
  tillRemovals,
  tills,
} from "@/db/schema";

import { businessScope, num } from "./_helpers";

export type RemoteOrderRow = {
  id: number;
  reference: string;
  placedAt: Date;
  branch: string | null;
  branchId: number | null;
  customer: string;
  phone: string | null;
  location: string | null;
  paymentMethod: string | null;
  amount: number;
  status: "pending" | "finished" | "cancelled";
  items: { name: string; qty: number; price: number }[];
};

export async function getRemoteOrders(): Promise<RemoteOrderRow[]> {
  const businessId = await businessScope();

  const orders = await db
    .select({
      id: remoteOrders.id,
      reference: remoteOrders.reference,
      placedAt: remoteOrders.placedAt,
      branch: branches.name,
      branchId: remoteOrders.branchId,
      customer: remoteOrders.customerName,
      phone: remoteOrders.phone,
      location: remoteOrders.deliveryLocation,
      paymentMethod: remoteOrders.paymentMethod,
      amount: remoteOrders.amount,
      status: remoteOrders.status,
    })
    .from(remoteOrders)
    .leftJoin(branches, eq(remoteOrders.branchId, branches.id))
    .where(eq(remoteOrders.businessId, businessId))
    .orderBy(desc(remoteOrders.placedAt));

  if (!orders.length) return [];

  const items = await db
    .select({
      orderId: remoteOrderItems.orderId,
      name: remoteOrderItems.name,
      qty: remoteOrderItems.quantity,
      price: remoteOrderItems.unitPrice,
    })
    .from(remoteOrderItems)
    .innerJoin(remoteOrders, eq(remoteOrderItems.orderId, remoteOrders.id))
    .where(eq(remoteOrders.businessId, businessId));

  const byOrder = new Map<number, { name: string; qty: number; price: number }[]>();
  for (const i of items) {
    const list = byOrder.get(i.orderId) ?? [];
    list.push({ name: i.name, qty: i.qty, price: num(i.price) });
    byOrder.set(i.orderId, list);
  }

  return orders.map((o) => ({
    ...o,
    amount: num(o.amount),
    items: byOrder.get(o.id) ?? [],
  }));
}

export async function getRemoteOrderByReference(reference: string) {
  const all = await getRemoteOrders();
  return all.find((o) => o.reference === reference) ?? null;
}

export async function getPendingOrders() {
  const all = await getRemoteOrders();
  return all.filter((o) => o.status === "pending");
}

export async function getPaymentProofs() {
  const businessId = await businessScope();
  return db
    .select({
      id: paymentProofs.id,
      ref: paymentProofs.reference,
      branch: branches.name,
      branchId: paymentProofs.branchId,
      customer: paymentProofs.customerName,
      phone: paymentProofs.phone,
      location: paymentProofs.location,
      method: paymentProofs.method,
      status: paymentProofs.status,
      imagePath: paymentProofs.imagePath,
      date: paymentProofs.submittedAt,
    })
    .from(paymentProofs)
    .leftJoin(branches, eq(paymentProofs.branchId, branches.id))
    .where(eq(paymentProofs.businessId, businessId))
    .orderBy(desc(paymentProofs.submittedAt));
}

export async function getTills() {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: tills.id,
      name: tills.name,
      branch: branches.name,
      branchId: tills.branchId,
      staff: tills.staffName,
      phone: tills.phone,
      balance: tills.balance,
      created: tills.createdAt,
    })
    .from(tills)
    .leftJoin(branches, eq(tills.branchId, branches.id))
    .where(eq(tills.businessId, businessId))
    .orderBy(asc(tills.name));

  return rows.map((r) => ({ ...r, balance: num(r.balance) }));
}

export async function getTillRemovals() {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: tillRemovals.id,
      till: tills.name,
      amount: tillRemovals.amount,
      approvedBy: tillRemovals.approvedByName,
      balanceAfter: tillRemovals.balanceAfter,
      date: tillRemovals.removedAt,
    })
    .from(tillRemovals)
    .innerJoin(tills, eq(tillRemovals.tillId, tills.id))
    .where(eq(tills.businessId, businessId))
    .orderBy(desc(tillRemovals.removedAt));

  return rows.map((r) => ({
    ...r,
    amount: num(r.amount),
    balanceAfter: num(r.balanceAfter),
  }));
}

export type DebtorRow = {
  id: number;
  name: string;
  phone: string | null;
  itemTaken: string | null;
  quantity: number;
  amountPaid: number;
  balance: number;
  branch: string | null;
  branchId: number | null;
  dueDate: Date | null;
  date: Date;
};

export async function getDebtors(): Promise<DebtorRow[]> {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: debtors.id,
      name: debtors.name,
      phone: debtors.phone,
      itemTaken: debtors.itemTaken,
      quantity: debtors.quantity,
      amountPaid: debtors.amountPaid,
      balance: debtors.balance,
      branch: branches.name,
      branchId: debtors.branchId,
      dueDate: debtors.dueDate,
      date: debtors.recordedAt,
    })
    .from(debtors)
    .leftJoin(branches, eq(debtors.branchId, branches.id))
    .where(eq(debtors.businessId, businessId))
    .orderBy(desc(debtors.balance));

  return rows.map((r) => ({
    ...r,
    amountPaid: num(r.amountPaid),
    balance: num(r.balance),
  }));
}

export async function getDebtorPayments(debtorId: number) {
  const rows = await db
    .select({
      id: debtorPayments.id,
      amount: debtorPayments.amount,
      balanceAfter: debtorPayments.balanceAfter,
      paidAt: debtorPayments.paidAt,
    })
    .from(debtorPayments)
    .where(eq(debtorPayments.debtorId, debtorId))
    .orderBy(desc(debtorPayments.paidAt));

  return rows.map((r) => ({
    ...r,
    amount: num(r.amount),
    balanceAfter: num(r.balanceAfter),
  }));
}

/** Public storefront catalogue — in-stock items only. */
export async function getStorefrontProducts() {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.sellingPrice,
      stock: products.stock,
      branch: branches.name,
      branchId: products.branchId,
      imagePath: products.imagePath,
    })
    .from(products)
    .leftJoin(branches, eq(products.branchId, branches.id))
    .where(and(eq(products.businessId, businessId), sql`${products.stock} > 0`))
    .orderBy(asc(products.name));

  return rows.map((r) => ({ ...r, price: num(r.price) }));
}
