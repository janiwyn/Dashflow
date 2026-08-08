"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { branches } from "@/db/schema";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

export async function updateBranch(input: {
  id: number;
  name: string;
  location: string;
  contact: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Branch name is required." };

  const result = await db
    .update(branches)
    .set({
      name: input.name.trim(),
      location: input.location.trim(),
      contact: input.contact.trim(),
    })
    .where(and(eq(branches.id, input.id), eq(branches.businessId, businessId)))
    .returning({ id: branches.id });

  if (!result.length) return { ok: false, message: "Branch not found." };

  revalidatePath("/list-branches");
  revalidatePath("/branches");
  revalidatePath(`/branch-view`);
  return { ok: true, message: "Branch updated successfully!" };
}

export async function createBranch(input: {
  name: string;
  location: string;
  contact: string;
  managerName?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Branch name is required." };

  await db.insert(branches).values({
    businessId,
    name: input.name.trim(),
    location: input.location.trim(),
    contact: input.contact.trim(),
    managerName: input.managerName?.trim() || null,
    status: "open",
  });

  revalidatePath("/list-branches");
  revalidatePath("/branches");
  return { ok: true, message: "Branch created successfully!" };
}

export async function setBranchStatus(
  id: number,
  status: "open" | "closed",
): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  await db
    .update(branches)
    .set({ status })
    .where(and(eq(branches.id, id), eq(branches.businessId, businessId)));

  revalidatePath("/list-branches");
  revalidatePath("/branches");
  return { ok: true, message: `Branch marked ${status}.` };
}
