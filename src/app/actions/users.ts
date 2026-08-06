"use server";

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { requireRole, requireUser } from "@/lib/session";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

const DEFAULT_PASSWORD = "123456";

/**
 * Resets a user's credential password to the default. Writes the same scrypt
 * hash better-auth produces, so the user can sign in normally afterwards.
 */
export async function resetUserPassword(userId: string): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { ok: false, message: "User not found." };

  // Admins may only reset within their own business; super admins are global.
  if (actor.role !== "super" && target.businessId !== actor.businessId) {
    return { ok: false, message: "You cannot reset users outside your business." };
  }

  const [credential] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .limit(1);

  const password = await hashPassword(DEFAULT_PASSWORD);

  if (credential) {
    await db
      .update(accounts)
      .set({ password, updatedAt: new Date() })
      .where(eq(accounts.id, credential.id));
  } else {
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password,
    });
  }

  revalidatePath("/reset-password");
  return {
    ok: true,
    message: `Password reset to the default (${DEFAULT_PASSWORD}) for ${target.username ?? target.email}.`,
  };
}

export async function setUserStatus(
  userId: string,
  status: "active" | "suspended",
): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { ok: false, message: "User not found." };
  if (actor.role !== "super" && target.businessId !== actor.businessId) {
    return { ok: false, message: "You cannot modify users outside your business." };
  }
  if (target.id === actor.id) {
    return { ok: false, message: "You cannot change your own status." };
  }

  await db.update(users).set({ status }).where(eq(users.id, userId));

  revalidatePath("/manage-admin");
  revalidatePath("/create-user");
  return { ok: true, message: `Account ${status === "active" ? "activated" : "suspended"}.` };
}

export async function updateUserRoleAndBranch(input: {
  userId: string;
  role?: "admin" | "manager" | "staff";
  branchId?: number | null;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");

  const [target] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!target) return { ok: false, message: "User not found." };
  if (actor.role !== "super" && target.businessId !== actor.businessId) {
    return { ok: false, message: "You cannot modify users outside your business." };
  }

  await db
    .update(users)
    .set({
      ...(input.role ? { role: input.role } : {}),
      ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
    })
    .where(eq(users.id, input.userId));

  revalidatePath("/manage-admin");
  revalidatePath("/create-user");
  return { ok: true, message: "User updated." };
}

/** Creates a login for a member of the current user's business. */
export async function createUserAccount(input: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "staff";
  branchId: number | null;
  phone?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");

  if (input.password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (existing) return { ok: false, message: "That email is already registered." };

  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    name: input.name,
    email: input.email,
    emailVerified: true,
    username: input.email.split("@")[0],
    phone: input.phone ?? null,
    role: input.role,
    status: "active",
    businessId: actor.businessId ?? 1,
    branchId: input.branchId,
  });

  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(input.password),
  });

  revalidatePath("/create-user");
  return { ok: true, message: `Account created for ${input.name}.` };
}

/** Lets the signed-in user update their own contact details. */
export async function updateOwnProfile(input: {
  name?: string;
  phone?: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  await db
    .update(users)
    .set({
      ...(input.name ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/profile");
  return { ok: true, message: "Profile updated." };
}
