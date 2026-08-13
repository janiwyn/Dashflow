"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { products, purchaseOrderItems, purchaseOrders, suppliers } from "@/db/schema";
import { getPurchaseOrderItems, getSupplierSuppliedProducts } from "@/db/queries/procurement";
import { getActiveModuleKeys } from "@/db/queries/modules";
import { requireRole, requireUser } from "@/lib/session";

import { recordPurchaseAccounting, recordSupplierPaymentAccounting } from "./ledger-engine";
import type { ActionResult } from "./users";

function revalidateAccountingPaths() {
  revalidatePath("/ledger");
  revalidatePath("/trial-balance");
  revalidatePath("/balance-sheet");
  revalidatePath("/income-statement");
  revalidatePath("/cash-book");
  revalidatePath("/add-transaction");
}

/** Read-only wrapper so the client can fetch one order's items on demand (e.g. to review before receiving). */
export async function fetchPurchaseOrderItems(purchaseOrderId: number) {
  await requireUser();
  return getPurchaseOrderItems(purchaseOrderId);
}

/** Read-only wrapper for a supplier's real supply history, fetched on demand when their detail card is opened. */
export async function fetchSupplierSuppliedProducts(supplierId: number) {
  await requireUser();
  return getSupplierSuppliedProducts(supplierId);
}

/** PO-<base36 timestamp> — same scheme as till receipts, so references sort the same way. */
function nextReference() {
  return `PO-${Date.now().toString(36).toUpperCase()}`;
}

function revalidateProcurement() {
  revalidatePath("/dashboard");
  revalidatePath("/suppliers");
}

/**
 * Creates a purchase order and its line items. Product names are always
 * re-read from the database rather than trusted from the client, so a stale
 * name in the browser can't get baked into the order's permanent record.
 */
export async function createPurchaseOrder(input: {
  supplierId: number | null;
  items: { productId: number; quantity: number; unitCost: number }[];
  notes?: string;
}): Promise<ActionResult & { reference?: string }> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const items = input.items.filter((i) => i.quantity > 0);
  if (items.length === 0) {
    return { ok: false, message: "Add at least one item with a quantity greater than zero." };
  }
  if (items.some((i) => i.unitCost < 0)) {
    return { ok: false, message: "Unit cost can't be negative." };
  }

  if (input.supplierId) {
    const [supplier] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.id, input.supplierId), eq(suppliers.businessId, businessId)))
      .limit(1);
    if (!supplier) return { ok: false, message: "Supplier not found." };
  }

  const productIds = items.map((i) => i.productId);
  const productRows = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(and(eq(products.businessId, businessId), inArray(products.id, productIds)));
  const byId = new Map(productRows.map((p) => [p.id, p]));

  for (const item of items) {
    if (!byId.has(item.productId)) return { ok: false, message: "One of the selected products no longer exists." };
  }

  const reference = nextReference();
  const totalCost = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const [po] = await db
    .insert(purchaseOrders)
    .values({
      businessId,
      supplierId: input.supplierId,
      reference,
      status: "pending",
      notes: input.notes?.trim() || null,
      totalCost,
      createdBy: actor.id,
    })
    .returning({ id: purchaseOrders.id });

  await db.insert(purchaseOrderItems).values(
    items.map((i) => ({
      purchaseOrderId: po.id,
      productId: i.productId,
      productName: byId.get(i.productId)!.name,
      quantity: i.quantity,
      unitCost: i.unitCost,
      subtotal: i.quantity * i.unitCost,
    })),
  );

  revalidateProcurement();
  return { ok: true, message: `Purchase order ${reference} created.`, reference };
}

/**
 * Marks an order received: bumps real product stock by each line's
 * quantity, and either pays the supplier on the spot or adds the total to
 * what's owed them — then, if Accounting is active, posts the real
 * double-entry side of whichever one happened so it shows up in the
 * ledger, trial balance and (for cash/bank) the cash book immediately.
 */
export async function receivePurchaseOrder(
  id: number,
  paymentMethod: "cash" | "bank" | "credit" = "credit",
): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const [po] = await db
    .select()
    .from(purchaseOrders)
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.businessId, businessId)))
    .limit(1);
  if (!po) return { ok: false, message: "Purchase order not found." };
  if (po.status !== "pending") return { ok: false, message: `This order is already ${po.status}.` };

  const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));

  for (const item of items) {
    if (item.productId) {
      await db
        .update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }
  }

  let supplierName = "Unknown supplier";
  if (po.supplierId) {
    const [supplier] = await db
      .select({ name: suppliers.name })
      .from(suppliers)
      .where(eq(suppliers.id, po.supplierId))
      .limit(1);
    supplierName = supplier?.name ?? supplierName;

    await db
      .update(suppliers)
      .set({
        // Paid on the spot never touches what's owed — only a credit
        // purchase adds to the running payable balance.
        ...(paymentMethod === "credit" ? { payable: sql`${suppliers.payable} + ${po.totalCost}` } : {}),
        lastDelivery: new Date().toISOString().slice(0, 10),
      })
      .where(eq(suppliers.id, po.supplierId));
  }

  await db.update(purchaseOrders).set({ status: "received", receivedAt: new Date() }).where(eq(purchaseOrders.id, id));

  const activeModules = await getActiveModuleKeys(businessId);
  if (activeModules.has("accounting")) {
    await recordPurchaseAccounting({
      businessId,
      reference: po.reference,
      supplierName,
      amount: po.totalCost,
      method: paymentMethod,
      handledById: actor.id,
      handledByName: actor.name,
      date: new Date(),
    });
  }

  revalidateProcurement();
  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidateAccountingPaths();
  return {
    ok: true,
    message:
      paymentMethod === "credit"
        ? `Purchase order ${po.reference} received — stock updated, added to ${supplierName}'s balance.`
        : `Purchase order ${po.reference} received and paid — stock updated.`,
  };
}

/** Records a real payment against what's owed a supplier — the other half of a credit purchase. */
export async function paySupplier(input: {
  supplierId: number;
  amount: number;
  method: "cash" | "bank";
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.amount || input.amount <= 0) return { ok: false, message: "Enter a valid amount." };

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, input.supplierId), eq(suppliers.businessId, businessId)))
    .limit(1);
  if (!supplier) return { ok: false, message: "Supplier not found." };

  const payable = Number(supplier.payable);
  if (input.amount > payable) {
    return { ok: false, message: "That's more than what's owed to this supplier." };
  }

  await db
    .update(suppliers)
    .set({ payable: payable - input.amount })
    .where(eq(suppliers.id, supplier.id));

  const activeModules = await getActiveModuleKeys(businessId);
  if (activeModules.has("accounting")) {
    await recordSupplierPaymentAccounting({
      businessId,
      supplierName: supplier.name,
      amount: input.amount,
      method: input.method,
      handledById: actor.id,
      handledByName: actor.name,
      date: new Date(),
    });
  }

  revalidateProcurement();
  revalidateAccountingPaths();
  return { ok: true, message: `Payment recorded for ${supplier.name}.` };
}

/** Cancels a purchase order that hasn't been received yet — a decision, not a delete, so the record stays. */
export async function cancelPurchaseOrder(id: number): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const [updated] = await db
    .update(purchaseOrders)
    .set({ status: "cancelled" })
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.businessId, businessId), eq(purchaseOrders.status, "pending")))
    .returning({ id: purchaseOrders.id, reference: purchaseOrders.reference });

  if (!updated) return { ok: false, message: "Purchase order not found or already finalized." };

  revalidateProcurement();
  return { ok: true, message: `Purchase order ${updated.reference} cancelled.` };
}
