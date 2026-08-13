"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

function revalidateSuppliers() {
  revalidatePath("/suppliers");
  revalidatePath("/dashboard");
}

type SupplierInput = {
  name: string;
  categoryId: number | null;
  contact: string;
  contactPerson: string;
  email: string;
  address: string;
  paymentTerms: string;
};

export async function createSupplier(input: SupplierInput): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Supplier name is required." };

  await db.insert(suppliers).values({
    businessId,
    name: input.name.trim(),
    categoryId: input.categoryId,
    contact: input.contact.trim() || null,
    contactPerson: input.contactPerson.trim() || null,
    email: input.email.trim() || null,
    address: input.address.trim() || null,
    paymentTerms: input.paymentTerms.trim() || null,
  });

  revalidateSuppliers();
  return { ok: true, message: `${input.name.trim()} added.` };
}

export async function updateSupplier(input: SupplierInput & { id: number }): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Supplier name is required." };

  const [updated] = await db
    .update(suppliers)
    .set({
      name: input.name.trim(),
      categoryId: input.categoryId,
      contact: input.contact.trim() || null,
      contactPerson: input.contactPerson.trim() || null,
      email: input.email.trim() || null,
      address: input.address.trim() || null,
      paymentTerms: input.paymentTerms.trim() || null,
    })
    .where(and(eq(suppliers.id, input.id), eq(suppliers.businessId, businessId)))
    .returning({ id: suppliers.id });

  if (!updated) return { ok: false, message: "Supplier not found." };

  revalidateSuppliers();
  return { ok: true, message: "Supplier updated." };
}

/** Purchase orders keep this supplier's name/history even after deletion — the FK sets to null, it never cascades. */
export async function deleteSupplier(id: number): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");
  const businessId = actor.businessId ?? 1;

  const [deleted] = await db
    .delete(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.businessId, businessId)))
    .returning({ id: suppliers.id });

  if (!deleted) return { ok: false, message: "Supplier not found." };

  revalidateSuppliers();
  return { ok: true, message: "Supplier removed." };
}
