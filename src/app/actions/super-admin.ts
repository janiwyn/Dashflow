"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { businessExists, setBusinessModuleKeys } from "@/db/queries/modules";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

export async function updateBusiness(input: {
  id: number;
  name: string;
  adminEmail: string;
  phone: string;
}): Promise<ActionResult> {
  await requireRole("super");

  if (!input.name.trim()) return { ok: false, message: "Business name is required." };

  const [updated] = await db
    .update(businesses)
    .set({ name: input.name.trim(), phone: input.phone.trim() })
    .where(eq(businesses.id, input.id))
    .returning({ id: businesses.id });

  if (!updated) return { ok: false, message: "Business not found." };

  // The admin email lives on the tenant's admin user, not the business row.
  if (input.adminEmail.trim()) {
    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.businessId, input.id))
      .limit(1);
    if (admin) {
      await db.update(users).set({ email: input.adminEmail.trim() }).where(eq(users.id, admin.id));
    }
  }

  revalidatePath("/manage-business");
  revalidatePath("/view-business");
  return { ok: true, message: "Business updated successfully!" };
}

export async function setBusinessStatus(
  id: number,
  status: "active" | "suspended",
): Promise<ActionResult> {
  await requireRole("super");
  await db.update(businesses).set({ status }).where(eq(businesses.id, id));

  revalidatePath("/manage-business");
  revalidatePath("/super");
  return { ok: true, message: `Business ${status === "active" ? "activated" : "suspended"}.` };
}

export async function setSubscriptionStatus(
  id: number,
  subscriptionStatus: "active" | "pending" | "expired",
): Promise<ActionResult> {
  await requireRole("super");
  await db.update(businesses).set({ subscriptionStatus }).where(eq(businesses.id, id));

  revalidatePath("/subscription");
  return { ok: true, message: "Subscription updated." };
}

export async function createBusiness(input: {
  name: string;
  phone: string;
  address: string;
}): Promise<ActionResult> {
  await requireRole("super");
  if (!input.name.trim()) return { ok: false, message: "Business name is required." };

  await db.insert(businesses).values({
    name: input.name.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    status: "active",
    subscriptionStatus: "pending",
  });

  revalidatePath("/manage-business");
  revalidatePath("/super");
  return { ok: true, message: "Business registered successfully!" };
}

/** The set of modules a business is subscribed to — what gates its UI and server actions. */
export async function updateBusinessModules(businessId: number, moduleKeys: ModuleKey[]): Promise<ActionResult> {
  await requireRole("super");

  const validKeys = moduleKeys.filter((k) => (MODULE_KEYS as readonly string[]).includes(k));
  if (!(await businessExists(businessId))) return { ok: false, message: "Business not found." };

  await setBusinessModuleKeys(businessId, validKeys);

  revalidatePath("/subscription");
  return { ok: true, message: "Modules updated." };
}

export async function updateAdmin(input: {
  id: string;
  email: string;
  role: "admin" | "manager";
}): Promise<ActionResult> {
  await requireRole("super");

  const [updated] = await db
    .update(users)
    .set({ email: input.email.trim(), role: input.role })
    .where(eq(users.id, input.id))
    .returning({ id: users.id });

  if (!updated) return { ok: false, message: "Admin not found." };

  revalidatePath("/manage-admin");
  return { ok: true, message: "Admin updated successfully!" };
}
