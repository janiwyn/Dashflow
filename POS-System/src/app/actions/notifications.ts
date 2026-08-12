"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/session";

import type { ActionResult } from "./users";

type AlertKind = "low_stock" | "shop_debtor" | "customer_debtor";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function setSuppression(
  kind: AlertKind,
  referenceId: number,
  title: string,
  dueDate: Date | null,
): Promise<ActionResult> {
  const user = await requireUser();
  const businessId = user.businessId ?? 1;

  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.businessId, businessId),
        eq(notifications.kind, kind),
        eq(notifications.referenceId, referenceId),
      ),
    )
    .limit(1);

  if (existing) {
    await db.update(notifications).set({ isRead: true, dueDate, title }).where(eq(notifications.id, existing.id));
  } else {
    await db.insert(notifications).values({ businessId, kind, referenceId, title, isRead: true, dueDate });
  }

  revalidatePath("/notifications");
  revalidatePath("/order-notifications");
  revalidatePath("/dashboard");
  return { ok: true, message: dueDate ? "Snoozed for a day." : "Dismissed." };
}

/** Clears an alert for good — it stays hidden until the underlying condition changes and a new event touches it. */
export async function dismissAlert(input: { kind: AlertKind; referenceId: number; title: string }): Promise<ActionResult> {
  return setSuppression(input.kind, input.referenceId, input.title, null);
}

/** Hides an alert for a day, then lets it resurface on its own. */
export async function snoozeAlert(input: { kind: AlertKind; referenceId: number; title: string }): Promise<ActionResult> {
  return setSuppression(input.kind, input.referenceId, input.title, new Date(Date.now() + ONE_DAY_MS));
}
