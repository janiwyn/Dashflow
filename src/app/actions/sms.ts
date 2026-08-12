"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { smsLogs } from "@/db/schema";
import { aliesmsConfigured, sendBatchSms } from "@/lib/aliesms";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

/**
 * Sends one message to one or more recipients via AlieSMS and logs the
 * outcome per recipient — real delivery log, not a decorative table.
 */
export async function sendSmsAlert(input: {
  recipients: string[];
  message: string;
  batchName?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const recipients = Array.from(new Set(input.recipients.map((r) => r.trim()).filter(Boolean)));
  const message = input.message.trim();

  if (recipients.length === 0) return { ok: false, message: "Add at least one recipient." };
  if (!message) return { ok: false, message: "Message can't be empty." };

  if (!aliesmsConfigured) {
    await db.insert(smsLogs).values(
      recipients.map((recipient) => ({ businessId, recipient, message, status: "failed" as const })),
    );
    revalidatePath("/sms");
    return {
      ok: false,
      message: "AlieSMS isn't set up for this business yet — an administrator needs to add the API credentials.",
    };
  }

  const result = await sendBatchSms({
    batchName: input.batchName?.trim() || `Dashflow ${new Date().toISOString().slice(0, 10)}`,
    message,
    recipients,
  });

  const invalid = new Set(result.ok ? result.invalidNumbers : []);
  await db.insert(smsLogs).values(
    recipients.map((recipient) => ({
      businessId,
      recipient,
      message,
      status: result.ok && !invalid.has(recipient) ? ("sent" as const) : ("failed" as const),
    })),
  );

  revalidatePath("/sms");

  if (!result.ok) return { ok: false, message: result.error };

  const delivered = result.totalRecipients - result.invalidNumbers.length;
  if (result.invalidNumbers.length > 0) {
    return {
      ok: true,
      message: `Sent to ${delivered} of ${result.totalRecipients} — ${result.invalidNumbers.join(", ")} invalid.`,
    };
  }
  return { ok: true, message: `Sent to ${delivered} recipient${delivered === 1 ? "" : "s"}.` };
}
