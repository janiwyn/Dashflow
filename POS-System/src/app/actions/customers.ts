"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

function revalidateCustomers() {
  revalidatePath("/customers");
  revalidatePath("/customer-file");
}

type CustomerInput = {
  name: string;
  type: "retail" | "wholesale";
  contact: string;
  email: string;
  preferredPaymentMethod: string;
};

export async function createCustomer(input: CustomerInput): Promise<ActionResult & { id?: number }> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Customer name is required." };

  const [created] = await db
    .insert(customers)
    .values({
      businessId,
      name: input.name.trim(),
      type: input.type,
      contact: input.contact.trim() || null,
      email: input.email.trim() || null,
      preferredPaymentMethod: input.preferredPaymentMethod.trim() || null,
    })
    .returning({ id: customers.id });

  revalidateCustomers();
  return { ok: true, message: `${input.name.trim()} added.`, id: created.id };
}

export async function updateCustomer(input: CustomerInput & { id: number }): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Customer name is required." };

  const [updated] = await db
    .update(customers)
    .set({
      name: input.name.trim(),
      type: input.type,
      contact: input.contact.trim() || null,
      email: input.email.trim() || null,
      preferredPaymentMethod: input.preferredPaymentMethod.trim() || null,
    })
    .where(and(eq(customers.id, input.id), eq(customers.businessId, businessId)))
    .returning({ id: customers.id });

  if (!updated) return { ok: false, message: "Customer not found." };

  revalidateCustomers();
  return { ok: true, message: "Customer updated." };
}

/** Sales keep their history either way — `sales.customerId` sets to null rather than cascading. */
export async function deleteCustomer(id: number): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");
  const businessId = actor.businessId ?? 1;

  const [deleted] = await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.businessId, businessId)))
    .returning({ id: customers.id });

  if (!deleted) return { ok: false, message: "Customer not found." };

  revalidateCustomers();
  return { ok: true, message: "Customer removed." };
}
