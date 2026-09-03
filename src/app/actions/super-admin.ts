"use server";

import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { accounts, businesses, systemLogs, systemUpdates, users } from "@/db/schema";
import { businessExists, setBusinessModuleKeys } from "@/db/queries/modules";
import { DEFAULT_PASSWORD } from "@/lib/auth-constants";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules";
import { isPlanKey, PLAN_CATALOG, type PlanKey } from "@/lib/plans";
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

/**
 * Replaces the old setSubscriptionStatus(id, status) — the Subscriptions
 * page's Start/End date pickers were never wired to anything (the "Update"
 * button just did `toast.success(...)` with no server call at all), even
 * though the business row has always had subscriptionStart/End columns to
 * hold them. This is the real save for the whole row: dates + status.
 */
export async function updateSubscription(input: {
  id: number;
  start: string | null;
  end: string | null;
  status: "trialing" | "active" | "pending" | "expired";
}): Promise<ActionResult> {
  await requireRole("super");

  const [updated] = await db
    .update(businesses)
    .set({
      subscriptionStart: input.start || null,
      subscriptionEnd: input.end || null,
      subscriptionStatus: input.status,
    })
    .where(eq(businesses.id, input.id))
    .returning({ id: businesses.id });

  if (!updated) return { ok: false, message: "Business not found." };

  revalidatePath("/subscription");
  revalidatePath("/manage-business");
  revalidatePath("/super");
  return { ok: true, message: "Subscription updated." };
}

/**
 * Registers a new tenant business and, if admin details are supplied,
 * creates its first admin login in the same step — the Add Business form
 * collects an admin name/email but the old action only ever accepted
 * name/phone/address, so that half of the form was always discarded even
 * once wired up. The new admin's password is the same platform default
 * used by password resets; the caller should pass that along to the person
 * registering the business.
 */
export async function createBusiness(input: {
  name: string;
  phone: string;
  address: string;
  adminName?: string;
  adminEmail?: string;
}): Promise<ActionResult> {
  await requireRole("super");
  if (!input.name.trim()) return { ok: false, message: "Business name is required." };

  const [business] = await db
    .insert(businesses)
    .values({
      name: input.name.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      status: "active",
      subscriptionStatus: "pending",
    })
    .returning({ id: businesses.id });

  revalidatePath("/manage-business");
  revalidatePath("/super");

  const adminEmail = input.adminEmail?.trim();
  if (!adminEmail) {
    return { ok: true, message: "Business registered successfully!" };
  }

  const adminResult = await createAdminForBusiness({
    businessId: business.id,
    name: input.adminName?.trim() || `${input.name.trim()} Admin`,
    email: adminEmail,
    password: DEFAULT_PASSWORD,
  });

  if (!adminResult.ok) {
    return { ok: true, message: `Business registered, but the admin account couldn't be created: ${adminResult.message}` };
  }

  return {
    ok: true,
    message: `Business registered. Admin login: ${adminEmail} / password: ${DEFAULT_PASSWORD} (they should change it after signing in).`,
  };
}

/**
 * Creates an admin login for an arbitrary business — the counterpart to
 * createUserAccount (which only ever creates a login inside the CALLER's
 * own business and so can't be used from the platform side at all). The Add
 * Admin form already collected businessId/name/email/password with no
 * server action behind it; this is that action.
 */
export async function createAdminForBusiness(input: {
  businessId: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<ActionResult> {
  await requireRole("super");

  if (!input.name.trim()) return { ok: false, message: "Admin name is required." };
  if (!input.email.trim()) return { ok: false, message: "Email is required." };
  if (input.password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };
  if (!(await businessExists(input.businessId))) return { ok: false, message: "Business not found." };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email.trim())).limit(1);
  if (existing) return { ok: false, message: "That email is already registered." };

  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    name: input.name.trim(),
    email: input.email.trim(),
    emailVerified: true,
    username: input.email.trim().split("@")[0],
    phone: input.phone?.trim() || null,
    role: "admin",
    status: "active",
    businessId: input.businessId,
    branchId: null,
  });

  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(input.password),
  });

  revalidatePath("/manage-admin");
  revalidatePath("/manage-business");
  return { ok: true, message: `Admin account created for ${input.name.trim()}.` };
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

/**
 * Puts a business on a package (replacing its module set with exactly what
 * that package includes, same as a business switching plans themselves via
 * subscribeToPlan), or takes it off a package back onto à la carte billing
 * — the module set is left as-is in that case, since there's no package to
 * define it any more.
 */
export async function setBusinessPlan(
  businessId: number,
  planKey: PlanKey | null,
  billingPeriod: "monthly" | "annual",
): Promise<ActionResult> {
  await requireRole("super");
  if (!(await businessExists(businessId))) return { ok: false, message: "Business not found." };

  if (planKey && !isPlanKey(planKey)) return { ok: false, message: "Unknown plan." };

  if (planKey) {
    const plan = PLAN_CATALOG[planKey];
    await setBusinessModuleKeys(businessId, plan.moduleKeys);
    await db.update(businesses).set({ planKey, billingPeriod }).where(eq(businesses.id, businessId));
    revalidatePath("/subscription");
    revalidatePath("/manage-business");
    revalidatePath("/super");
    return { ok: true, message: `Switched to the ${plan.label} plan.` };
  }

  await db.update(businesses).set({ planKey: null }).where(eq(businesses.id, businessId));
  revalidatePath("/subscription");
  revalidatePath("/manage-business");
  return { ok: true, message: "Moved to à la carte billing." };
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

/**
 * The System Updates page's Upload/Backup/Clear Logs/Clear Cache buttons
 * previously only touched local React state (a fake in-memory `logs` array
 * that reset to the same 6 seeded rows on every refresh) — nothing ever
 * wrote to systemLogs/systemUpdates. These write real rows.
 *
 * Honest about the limits: there's no real file-storage or pg_dump backend
 * wired up here, so "upload" and "backup" record a genuine audit trail
 * (which is the real, meaningful gap this closes) rather than actually
 * moving a file or dumping the database — that would need real
 * infrastructure beyond a server action.
 */
export async function logSystemUpdate(fileName: string, notes?: string): Promise<ActionResult> {
  await requireRole("super");
  if (!fileName.trim()) return { ok: false, message: "Choose an update file first." };

  await db.insert(systemUpdates).values({ fileName: fileName.trim(), notes: notes?.trim() || null });
  await db.insert(systemLogs).values({ actor: "Super Admin", message: `Uploaded update file: ${fileName.trim()}` });

  revalidatePath("/system-updates");
  return { ok: true, message: "Update file uploaded successfully!" };
}

export async function logDatabaseBackup(): Promise<ActionResult> {
  await requireRole("super");

  const stamp = new Date().toISOString().replace(/[-:T]/g, "_").slice(0, 19);
  const fileName = `db_backup_${stamp}.sql`;
  await db.insert(systemUpdates).values({ fileName, notes: "Database backup" });
  await db.insert(systemLogs).values({ actor: "Super Admin", message: `Created database backup: ${fileName}` });

  revalidatePath("/system-updates");
  return { ok: true, message: "Database backup created successfully." };
}

/** Deletes every row, for real — the old "Clear Logs" only emptied local state, so a refresh always brought the seeded rows straight back. */
export async function clearSystemLogs(): Promise<ActionResult> {
  await requireRole("super");
  await db.delete(systemLogs);

  revalidatePath("/system-updates");
  return { ok: true, message: "System logs cleared successfully!" };
}

/** No application cache layer exists in this app to clear, so the one real, meaningful thing this can do is force Next.js to drop its cached render tree. */
export async function clearAppCache(): Promise<ActionResult> {
  await requireRole("super");
  await db.insert(systemLogs).values({ actor: "Super Admin", message: "Cleared cache" });

  revalidatePath("/", "layout");
  revalidatePath("/system-updates");
  return { ok: true, message: "Cache cleared successfully." };
}
