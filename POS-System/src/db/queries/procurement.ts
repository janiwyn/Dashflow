import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { purchaseOrderItems, purchaseOrders, suppliers } from "@/db/schema";

import { businessScope, num } from "./_helpers";

export type PurchaseOrderRow = {
  id: number;
  reference: string;
  supplierId: number | null;
  supplierName: string | null;
  status: "pending" | "received" | "cancelled";
  itemCount: number;
  totalCost: number;
  notes: string | null;
  orderedAt: Date;
  receivedAt: Date | null;
};

/** Every purchase order for this business, most recently ordered first. */
export async function getPurchaseOrders(): Promise<PurchaseOrderRow[]> {
  const businessId = await businessScope();

  const rows = await db
    .select({
      id: purchaseOrders.id,
      reference: purchaseOrders.reference,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      status: purchaseOrders.status,
      totalCost: purchaseOrders.totalCost,
      notes: purchaseOrders.notes,
      orderedAt: purchaseOrders.orderedAt,
      receivedAt: purchaseOrders.receivedAt,
      itemCount: sql<number>`(
        select coalesce(sum(${purchaseOrderItems.quantity}), 0)
        from ${purchaseOrderItems}
        where ${purchaseOrderItems.purchaseOrderId} = ${purchaseOrders.id}
      )`,
    })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .where(eq(purchaseOrders.businessId, businessId))
    .orderBy(desc(purchaseOrders.orderedAt));

  return rows.map((r) => ({ ...r, totalCost: num(r.totalCost), itemCount: num(r.itemCount) }));
}

export type PurchaseOrderItemRow = {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
};

/** Line items for one purchase order — scoped so an id from another business can never leak items. */
export async function getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItemRow[]> {
  const businessId = await businessScope();

  const [po] = await db
    .select({ id: purchaseOrders.id })
    .from(purchaseOrders)
    .where(and(eq(purchaseOrders.id, purchaseOrderId), eq(purchaseOrders.businessId, businessId)))
    .limit(1);
  if (!po) return [];

  const rows = await db
    .select({
      id: purchaseOrderItems.id,
      productId: purchaseOrderItems.productId,
      productName: purchaseOrderItems.productName,
      quantity: purchaseOrderItems.quantity,
      unitCost: purchaseOrderItems.unitCost,
      subtotal: purchaseOrderItems.subtotal,
    })
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));

  return rows.map((r) => ({ ...r, unitCost: num(r.unitCost), subtotal: num(r.subtotal) }));
}

export type SuppliedProductRow = {
  productId: number | null;
  productName: string;
  totalQuantity: number;
  orderCount: number;
  lastOrderedAt: Date;
};

/** What a supplier has actually supplied — derived from their real order history, not a manually maintained list. */
export async function getSupplierSuppliedProducts(supplierId: number): Promise<SuppliedProductRow[]> {
  const businessId = await businessScope();

  const rows = await db
    .select({
      productId: purchaseOrderItems.productId,
      productName: purchaseOrderItems.productName,
      totalQuantity: sql<number>`sum(${purchaseOrderItems.quantity})`,
      orderCount: sql<number>`count(distinct ${purchaseOrderItems.purchaseOrderId})`,
      lastOrderedAt: sql<Date>`max(${purchaseOrders.orderedAt})`,
    })
    .from(purchaseOrderItems)
    .innerJoin(purchaseOrders, eq(purchaseOrderItems.purchaseOrderId, purchaseOrders.id))
    .where(and(eq(purchaseOrders.businessId, businessId), eq(purchaseOrders.supplierId, supplierId)))
    .groupBy(purchaseOrderItems.productId, purchaseOrderItems.productName)
    .orderBy(desc(sql`sum(${purchaseOrderItems.quantity})`));

  return rows.map((r) => ({ ...r, totalQuantity: num(r.totalQuantity), orderCount: num(r.orderCount) }));
}
