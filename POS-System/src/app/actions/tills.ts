"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { branches, tillRemovals, tills } from "@/db/schema";
import { enforcedBranchId } from "@/db/queries/_helpers";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

function revalidateTills() {
  revalidatePath("/till-management");
}

/**
 * The Create & Assign Till tab previously had no server action behind it at
 * all — the button had no onClick handler and nothing in the codebase wrote
 * to the tills table outside of seed data. This is the real thing.
 */
export async function createTill(input: {
  name: string;
  branchName?: string;
  staffName?: string;
  phone?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Till name is required." };

  let branchId: number | null = null;
  if (input.branchName) {
    const [branch] = await db
      .select({ id: branches.id })
      .from(branches)
      .where(and(eq(branches.businessId, businessId), eq(branches.name, input.branchName)))
      .limit(1);
    if (!branch) return { ok: false, message: "Selected branch not found." };
    branchId = branch.id;
  }
  // A branch-locked manager can't create a till outside their own branch,
  // regardless of what the form submitted — same enforcement getDebtors/
  // createDebtor already rely on.
  branchId = (await enforcedBranchId(branchId ?? undefined)) ?? null;

  await db.insert(tills).values({
    businessId,
    branchId,
    name: input.name.trim(),
    staffName: input.staffName?.trim() || null,
    phone: input.phone?.trim() || null,
    balance: 0,
  });

  revalidateTills();
  return { ok: true, message: `Till "${input.name.trim()}" created.` };
}

/**
 * "Remove cash to safe" used to be entirely client-side — submitRemoval()
 * only set local React state to print a canned "recorded successfully"
 * string, with no fetch/server action/db write anywhere, no validation
 * against the till's real balance, and till_removals stayed empty forever
 * no matter how many times someone clicked it. This actually records it.
 */
export async function recordTillRemoval(input: { tillId: number; amount: number }): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.amount || input.amount <= 0) return { ok: false, message: "Enter a valid amount." };

  const [till] = await db
    .select()
    .from(tills)
    .where(and(eq(tills.id, input.tillId), eq(tills.businessId, businessId)))
    .limit(1);
  if (!till) return { ok: false, message: "Till not found." };

  const branchId = await enforcedBranchId();
  if (branchId && till.branchId !== branchId) {
    return { ok: false, message: "You can only manage tills in your own branch." };
  }

  const currentBalance = Number(till.balance);
  if (input.amount > currentBalance) {
    return { ok: false, message: "That's more than the till currently holds." };
  }

  const newBalance = Math.max(currentBalance - input.amount, 0);

  await db.insert(tillRemovals).values({
    tillId: till.id,
    amount: input.amount,
    approvedByName: actor.name,
    balanceAfter: newBalance,
  });

  await db.update(tills).set({ balance: newBalance }).where(eq(tills.id, till.id));

  revalidateTills();
  return { ok: true, message: "Till removal recorded successfully." };
}
