"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

/**
 * Lets an admin/super account update their own business's profile and
 * currency. Unlike updateBusiness in super-admin.ts (platform staff editing
 * any tenant), this is scoped to the actor's own business only.
 */
export async function updateBusinessSettings(input: {
  name: string;
  tagline: string;
  phone: string;
  address: string;
  taxPin: string;
  currency: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Business name is required." };

  const validCode = SUPPORTED_CURRENCIES.some((c) => c.code === input.currency);
  if (!validCode) return { ok: false, message: "Unsupported currency." };

  await db
    .update(businesses)
    .set({
      name: input.name.trim(),
      tagline: input.tagline.trim() || null,
      phone: input.phone.trim() || null,
      address: input.address.trim() || null,
      taxPin: input.taxPin.trim() || null,
      currency: input.currency,
    })
    .where(eq(businesses.id, businessId));

  // The currency affects nearly every screen, so revalidate broadly rather
  // than trying to enumerate every path that renders a money amount.
  revalidatePath("/", "layout");

  return { ok: true, message: "Settings updated successfully!" };
}
