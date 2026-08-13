"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { customers, products, saleItems, sales } from "@/db/schema";
import { assertClockedIn } from "@/db/queries/attendance";
import { getActiveModuleKeys } from "@/db/queries/modules";
import { requireUser } from "@/lib/session";

import { recordSaleAccounting } from "./ledger-engine";
import type { ActionResult } from "./users";

export type CartLine = { sku: string; qty: number };

const TAX_RATE = 16;

/** RCP-<base36 timestamp> — monotonic per process, so collisions in practice don't happen. */
function nextReference() {
  return `RCP-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Completes a till sale: validates stock against the database (never the
 * client's numbers), records the sale and its line items, and decrements
 * stock — the POS -> Inventory link the platform is built around. Prices
 * are always re-read from the product row, not trusted from the cart, so a
 * stale price in the browser can't under- or over-charge a customer.
 */
export async function checkoutSale(input: {
  items: CartLine[];
  method: "cash" | "mpesa" | "card";
  customerName?: string;
  customerId?: number;
}): Promise<ActionResult & { reference?: string }> {
  const user = await requireUser();
  const businessId = user.businessId ?? 1;

  const clockGate = await assertClockedIn(user.id);
  if (!clockGate.ok) return clockGate;

  if (input.items.length === 0) return { ok: false, message: "The cart is empty." };

  let customerId: number | null = null;
  let customerName = input.customerName?.trim() || "Walk-in";

  if (input.customerId) {
    const [customer] = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(and(eq(customers.id, input.customerId), eq(customers.businessId, businessId)))
      .limit(1);
    if (!customer) return { ok: false, message: "Selected customer not found." };
    customerId = customer.id;
    customerName = customer.name;
  }

  const skus = input.items.map((i) => i.sku);
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.businessId, businessId), inArray(products.sku, skus)));

  const bySku = new Map(rows.map((p) => [p.sku, p]));
  for (const item of input.items) {
    const product = bySku.get(item.sku);
    if (!product) return { ok: false, message: `A product in the cart no longer exists.` };
    if (item.qty <= 0) return { ok: false, message: `Invalid quantity for ${product.name}.` };
    if (product.stock < item.qty) {
      return { ok: false, message: `Only ${product.stock} of ${product.name} left in stock.` };
    }
  }

  const lines = input.items.map((item) => {
    const product = bySku.get(item.sku)!;
    return { product, qty: item.qty };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.product.sellingPrice * l.qty, 0);
  const taxAmount = Math.round((subtotal * TAX_RATE) / 100);
  const total = subtotal + taxAmount;
  const reference = nextReference();

  const [sale] = await db
    .insert(sales)
    .values({
      businessId,
      branchId: user.branchId ?? null,
      reference,
      customerId,
      customerName,
      cashierId: user.id,
      cashierName: user.name,
      method: input.method,
      status: "paid",
      subtotal,
      taxRate: TAX_RATE,
      taxAmount,
      total,
      amountPaid: total,
      soldAt: new Date(),
    })
    .returning({ id: sales.id, reference: sales.reference });

  await db.insert(saleItems).values(
    lines.map((l) => ({
      saleId: sale.id,
      productId: l.product.id,
      name: l.product.name,
      sku: l.product.sku,
      quantity: l.qty,
      unitPrice: l.product.sellingPrice,
    })),
  );

  for (const l of lines) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${l.qty}` })
      .where(eq(products.id, l.product.id));
  }

  // Auto-post to the books, only if the business actually subscribes to
  // Accounting — no point writing ledger data nobody can see or asked for.
  const activeModules = await getActiveModuleKeys(businessId);
  if (activeModules.has("accounting")) {
    await recordSaleAccounting({
      businessId,
      branchId: user.branchId ?? null,
      reference,
      amount: total,
      method: input.method,
      handledById: user.id,
      handledByName: user.name,
      date: new Date(),
    });
  }

  revalidatePath("/pos");
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
  revalidatePath("/customers");
  revalidatePath("/customer-file");

  return { ok: true, message: `Sale ${reference} completed.`, reference: sale.reference };
}
