"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { products, remoteOrderItems, remoteOrders, saleItems, sales } from "@/db/schema";
import { num } from "@/db/queries/_helpers";
import { getActiveModuleKeys } from "@/db/queries/modules";
import { requireUser } from "@/lib/session";

import { recordSaleAccounting } from "./ledger-engine";
import type { ActionResult } from "./users";

/** Cancels a pending remote order — the other outcome besides completing it, so one doesn't just sit forever unfulfillable. */
export async function cancelRemoteOrder(reference: string): Promise<ActionResult> {
  const user = await requireUser();
  const businessId = user.businessId ?? 1;

  const [order] = await db
    .select({ id: remoteOrders.id, status: remoteOrders.status })
    .from(remoteOrders)
    .where(and(eq(remoteOrders.businessId, businessId), eq(remoteOrders.reference, reference.trim())))
    .limit(1);

  if (!order) return { ok: false, message: "No order found with that reference." };
  if (order.status !== "pending") return { ok: false, message: `Order is already ${order.status}.` };

  await db.update(remoteOrders).set({ status: "cancelled" }).where(eq(remoteOrders.id, order.id));

  revalidatePath("/order-notifications");
  revalidatePath("/remote-orders");
  revalidatePath("/qr-scanner");
  revalidatePath("/dashboard");

  return { ok: true, message: `Order ${reference} cancelled.` };
}

/** RCP-<base36 timestamp> — same scheme as the till, so receipts sort the same way regardless of origin. */
function nextReference() {
  return `RCP-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Completes a remote (pickup/delivery) order at the counter — what the QR
 * scanner hands off to once it's found the order. Records a real sale
 * against the order's items, decrements stock the same way a till sale
 * does, and marks the order finished so it can't be completed twice.
 */
export async function completeRemoteOrder(input: {
  reference: string;
  method: "cash" | "mpesa" | "card" | "bank";
}): Promise<ActionResult & { receiptReference?: string }> {
  const user = await requireUser();
  const businessId = user.businessId ?? 1;

  const [order] = await db
    .select()
    .from(remoteOrders)
    .where(and(eq(remoteOrders.businessId, businessId), eq(remoteOrders.reference, input.reference.trim())))
    .limit(1);

  if (!order) return { ok: false, message: "No order found with that reference." };
  if (order.status !== "pending") {
    return { ok: false, message: `Order ${order.reference} is already ${order.status}.` };
  }

  const items = await db
    .select()
    .from(remoteOrderItems)
    .where(eq(remoteOrderItems.orderId, order.id));

  if (items.length === 0) return { ok: false, message: "This order has no items to complete." };

  const productIds = items.map((i) => i.productId).filter((id): id is number => id != null);
  const dbProducts = productIds.length
    ? await db
        .select()
        .from(products)
        .where(and(eq(products.businessId, businessId), inArray(products.id, productIds)))
    : [];
  const byId = new Map(dbProducts.map((p) => [p.id, p]));

  for (const item of items) {
    if (item.productId == null) continue;
    const product = byId.get(item.productId);
    if (!product) return { ok: false, message: `${item.name} is no longer in the catalogue.` };
    if (product.stock < item.quantity) {
      return { ok: false, message: `Only ${product.stock} of ${item.name} left in stock.` };
    }
  }

  // The order's own line prices are the quote the customer already agreed
  // to at placement — completing it shouldn't add tax on top and surprise
  // them at pickup.
  const subtotal = items.reduce((sum, i) => sum + num(i.unitPrice) * i.quantity, 0);

  const [sale] = await db
    .insert(sales)
    .values({
      businessId,
      branchId: order.branchId,
      reference: nextReference(),
      customerName: order.customerName,
      cashierId: user.id,
      cashierName: user.name,
      method: input.method,
      status: "paid",
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      total: subtotal,
      amountPaid: subtotal,
      soldAt: new Date(),
    })
    .returning({ id: sales.id, reference: sales.reference });

  await db.insert(saleItems).values(
    items.map((i) => ({
      saleId: sale.id,
      productId: i.productId,
      name: i.name,
      sku: i.productId ? (byId.get(i.productId)?.sku ?? null) : null,
      quantity: i.quantity,
      unitPrice: num(i.unitPrice),
    })),
  );

  for (const item of items) {
    if (item.productId == null) continue;
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }

  await db.update(remoteOrders).set({ status: "finished" }).where(eq(remoteOrders.id, order.id));

  const activeModules = await getActiveModuleKeys(businessId);
  if (activeModules.has("accounting")) {
    await recordSaleAccounting({
      businessId,
      branchId: order.branchId,
      reference: sale.reference,
      amount: subtotal,
      method: input.method,
      handledById: user.id,
      handledByName: user.name,
      date: new Date(),
    });
  }

  revalidatePath("/qr-scanner");
  revalidatePath("/remote-orders");
  revalidatePath("/order-notifications");
  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/receipt-preview");
  revalidatePath("/ledger");
  revalidatePath("/trial-balance");
  revalidatePath("/balance-sheet");
  revalidatePath("/income-statement");
  revalidatePath("/cash-book");
  revalidatePath("/add-transaction");

  return { ok: true, message: `Order completed — receipt ${sale.reference}.`, receiptReference: sale.reference };
}
