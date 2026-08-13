"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { paymentProofs } from "@/db/schema";
import { enforcedBranchId } from "@/db/queries/_helpers";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

/** Base64 inflates size by ~1.37x — this bounds the encoded string to roughly a 2MB source image. */
const MAX_IMAGE_DATA_URL_LENGTH = 2 * 1024 * 1024 * 1.4;

function revalidatePaymentProofs() {
  revalidatePath("/payment-proofs");
}

/**
 * Logs a mobile-money payment screenshot against an order — staff enter
 * these on a customer's behalf (the usual flow: a screenshot arrives over
 * WhatsApp/SMS and gets logged here for a manager to verify), so there's
 * no separate customer-upload path to build.
 */
export async function createPaymentProof(input: {
  reference: string;
  branchId: number | null;
  customerName: string;
  phone: string;
  location: string;
  method: "mtn_merchant" | "airtel_merchant";
  imageDataUrl: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager", "staff");
  const businessId = actor.businessId ?? 1;

  if (!input.reference.trim()) return { ok: false, message: "Order reference is required." };
  if (!input.customerName.trim()) return { ok: false, message: "Customer name is required." };
  if (!input.imageDataUrl.startsWith("data:image/")) {
    return { ok: false, message: "Attach a screenshot image." };
  }
  if (input.imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    return { ok: false, message: "Image is too large — keep it under 2MB." };
  }

  const branchId = await enforcedBranchId(input.branchId ?? undefined);

  await db.insert(paymentProofs).values({
    businessId,
    reference: input.reference.trim(),
    branchId: branchId ?? null,
    customerName: input.customerName.trim(),
    phone: input.phone.trim() || null,
    location: input.location.trim() || null,
    method: input.method,
    status: "pending",
    imagePath: input.imageDataUrl,
  });

  revalidatePaymentProofs();
  return { ok: true, message: "Payment proof logged for review." };
}

/** Manager-only — approving/rejecting is a review authority, unlike logging one in the first place. */
export async function reviewPaymentProof(id: number, status: "verified" | "rejected"): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const [updated] = await db
    .update(paymentProofs)
    .set({ status, reviewedById: actor.id })
    .where(and(eq(paymentProofs.id, id), eq(paymentProofs.businessId, businessId)))
    .returning({ id: paymentProofs.id });
  if (!updated) return { ok: false, message: "Payment proof not found." };

  revalidatePaymentProofs();
  return { ok: true, message: status === "verified" ? "Payment proof verified." : "Payment proof rejected." };
}
