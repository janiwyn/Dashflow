"use server";

import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { sendBatchSms } from "@/lib/aliesms";
import { DEFAULT_PASSWORD } from "@/lib/auth-constants";
import { refreshSessionCookie, requireRole, requireUser } from "@/lib/session";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

/** Digits only — phone numbers in the data are stored in a few different formats ("0700 000 000" vs "0700123456"), so an exact string match would miss a number typed differently than it's stored. */
const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

/** Every account whose phone (normalized) matches — used instead of a plain unique lookup because `users.phone` has no uniqueness constraint and real duplicates exist. */
async function findUsersByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];
  return db
    .select()
    .from(users)
    .where(sql`regexp_replace(${users.phone}, '\\D', '', 'g') = ${normalized}`);
}

/** Writes the same scrypt hash better-auth produces, so a user can sign in normally afterwards. Shared by every path that resets a password to a temporary value. */
async function setCredentialPassword(userId: string, plainPassword: string): Promise<void> {
  const [credential] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .limit(1);

  const password = await hashPassword(plainPassword);

  if (credential) {
    await db.update(accounts).set({ password, updatedAt: new Date() }).where(eq(accounts.id, credential.id));
  } else {
    await db.insert(accounts).values({ id: crypto.randomUUID(), accountId: userId, providerId: "credential", userId, password });
  }
}

/**
 * Resets a user's credential password to the default and flags the account
 * so it's forced through "set a new password" on next login — an admin
 * handing someone a default password shouldn't leave them permanently on it.
 */
export async function resetUserPassword(userId: string): Promise<ActionResult> {
  const actor = await requireRole("super", "admin");

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return { ok: false, message: "User not found." };

  // Admins may only reset within their own business; super admins are global.
  if (actor.role !== "super" && target.businessId !== actor.businessId) {
    return { ok: false, message: "You cannot reset users outside your business." };
  }

  await setCredentialPassword(userId, DEFAULT_PASSWORD);
  await db.update(users).set({ mustChangePassword: true }).where(eq(users.id, userId));

  revalidatePath("/reset-password");
  return {
    ok: true,
    message: `Password reset to the default (${DEFAULT_PASSWORD}) for ${target.username ?? target.email}.`,
  };
}

const RESET_CODE_TTL_MS = 15 * 60 * 1000;

/**
 * Self-service "forgot password", step 1 of 2 — AlieSMS delivers to a phone
 * number, so that's what this looks up by (not email — there's no email
 * provider configured in this app at all, see src/lib/auth.ts). The code is
 * stored hashed and separately from the real login credential, which is left
 * untouched until verifyAndSetPassword() confirms it — requesting a reset (or
 * abandoning one) never breaks a still-known working password, and nothing
 * here ever creates a session, so this never touches the login page at all.
 * Always returns the same generic message regardless of whether the number
 * matched an account, to prevent account enumeration from this public form.
 *
 * `users.phone` has no uniqueness constraint, and genuinely can match more
 * than one account — the same person legitimately running two businesses
 * from one phone, not just messy data. Rather than refuse to send anything
 * in that case, the same code goes out once to the shared phone and gets
 * stored on every matching account; verifyAndSetPassword() then asks for the
 * account's email too, so which one actually gets reset is still explicit.
 */
export async function requestSmsPasswordReset(phone: string): Promise<ActionResult> {
  const GENERIC_OK: ActionResult = {
    ok: true,
    message: "If that number is on an account, we've texted it a verification code.",
  };

  const matches = await findUsersByPhone(phone);
  if (matches.length === 0) return GENERIC_OK;

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const resetCode = await hashPassword(code);
  const resetCodeExpiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);
  await Promise.all(
    matches.map((m) => db.update(users).set({ resetCode, resetCodeExpiresAt }).where(eq(users.id, m.id))),
  );

  const sent = await sendBatchSms({
    batchName: `Password reset code — ${matches[0].phone}`,
    message: `Your Dashflow POS verification code is ${code}. It expires in 15 minutes.`,
    recipients: [matches[0].phone!],
  });
  // Still returns the same generic message either way — an SMS failure here
  // shouldn't reveal to an outside caller whether the number was valid — but
  // it's worth a server-side trace, since this is otherwise indistinguishable
  // from "no account matched" while debugging a real report of "no code arrived".
  if (!sent.ok) console.error(`[password-reset] AlieSMS send failed for ${matches[0].phone}: ${sent.error}`);

  return GENERIC_OK;
}

/**
 * Step 2 — verifies the texted code against the specific account (phone +
 * email — email disambiguates when a phone matches more than one account)
 * and, only if it's correct and not expired, sets the real password
 * directly. No session is created or required; the caller redirects to
 * /login afterwards to sign in normally with the new password.
 */
export async function verifyAndSetPassword(input: {
  phone: string;
  email: string;
  code: string;
  newPassword: string;
}): Promise<ActionResult> {
  const code = input.code.trim();
  const email = input.email.trim().toLowerCase();
  const INVALID: ActionResult = { ok: false, message: "That code is invalid or has expired." };

  if (!code || !email) return INVALID;
  if (input.newPassword.length < 8) return { ok: false, message: "Password must be at least 8 characters." };

  const matches = await findUsersByPhone(input.phone);
  const target = matches.find((m) => m.email.toLowerCase() === email);
  if (!target?.resetCode || !target.resetCodeExpiresAt) return INVALID;
  if (target.resetCodeExpiresAt.getTime() < Date.now()) return INVALID;

  const matchesCode = await verifyPassword({ hash: target.resetCode, password: code });
  if (!matchesCode) return INVALID;

  await setCredentialPassword(target.id, input.newPassword);
  await db.update(users).set({ resetCode: null, resetCodeExpiresAt: null, mustChangePassword: false }).where(eq(users.id, target.id));

  return { ok: true, message: "Password set — you can now log in." };
}

/**
 * Called from /new-password when a signed-in user is on an admin-issued
 * default password (resetUserPassword) and needs to set their own — the
 * self-service SMS flow (verifyAndSetPassword above) never creates a session
 * on the temporary value at all, so it doesn't need this.
 */
export async function setOwnPassword(newPassword: string): Promise<ActionResult> {
  const user = await requireUser();

  if (newPassword.length < 8) return { ok: false, message: "Password must be at least 8 characters." };

  await setCredentialPassword(user.id, newPassword);
  await db.update(users).set({ mustChangePassword: false }).where(eq(users.id, user.id));
  // Without this, the (app) layout's mustChangePassword check keeps reading
  // the pre-update value from the session cookie cache (up to 5 minutes —
  // see refreshSessionCookie's own comment) and bounces the user right back
  // here even though the database is already correct.
  await refreshSessionCookie();

  return { ok: true, message: "Password updated." };
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

  revalidatePath("/settings");
  return { ok: true, message: "Profile updated." };
}

/**
 * Persists the caller's own light/dark preference to their account, not the
 * device — so the choice follows them from terminal to terminal and never
 * leaks to the next different account that logs into the same browser.
 */
export async function setOwnTheme(theme: "light" | "dark"): Promise<ActionResult> {
  const user = await requireUser();

  await db.update(users).set({ theme }).where(eq(users.id, user.id));

  revalidatePath("/", "layout");
  return { ok: true, message: "Theme updated." };
}
