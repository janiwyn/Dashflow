import "server-only";

import { asc, count, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { branches, businesses, products, sales, systemLogs, systemUpdates, users } from "@/db/schema";

/**
 * Super-admin queries are deliberately NOT tenant-scoped — they span every
 * business on the platform. Pages using them must gate on requireRole("super").
 */

export type BusinessRow = {
  id: number;
  name: string;
  adminName: string | null;
  adminEmail: string | null;
  phone: string | null;
  address: string | null;
  dateRegistered: string;
  status: "active" | "suspended";
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  subscriptionStatus: "trialing" | "active" | "pending" | "expired";
  branchCount: number;
  planKey: string | null;
  billingPeriod: "monthly" | "annual";
};

export async function getBusinesses(): Promise<BusinessRow[]> {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      adminName: sql<string | null>`(
        select ${users}.name from ${users}
        where ${users}.business_id = ${businesses}.id and ${users}.role = 'admin'
        order by ${users}.created_at limit 1
      )`,
      adminEmail: sql<string | null>`(
        select ${users}.email from ${users}
        where ${users}.business_id = ${businesses}.id and ${users}.role = 'admin'
        order by ${users}.created_at limit 1
      )`,
      phone: businesses.phone,
      address: businesses.address,
      dateRegistered: businesses.dateRegistered,
      status: businesses.status,
      subscriptionStart: businesses.subscriptionStart,
      subscriptionEnd: businesses.subscriptionEnd,
      subscriptionStatus: businesses.subscriptionStatus,
      branchCount: sql<number>`(select count(*) from ${branches} where ${branches}.business_id = ${businesses}.id)`,
      planKey: businesses.planKey,
      billingPeriod: businesses.billingPeriod,
    })
    .from(businesses)
    .orderBy(asc(businesses.id));

  return rows.map((r) => ({ ...r, branchCount: Number(r.branchCount ?? 0) }));
}

export async function getBusinessById(id: number) {
  const all = await getBusinesses();
  return all.find((b) => b.id === id) ?? null;
}

export type AdminRow = {
  id: string;
  username: string | null;
  name: string;
  email: string;
  businessId: number | null;
  businessName: string | null;
  role: string;
  status: string;
  createdAt: Date;
};

export async function getAdmins(): Promise<AdminRow[]> {
  return db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      businessId: users.businessId,
      businessName: businesses.name,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(businesses, eq(users.businessId, businesses.id))
    .where(ne(users.role, "staff"))
    .orderBy(asc(users.name));
}

export async function getAdminById(id: string) {
  const all = await getAdmins();
  return all.find((a) => a.id === id) ?? null;
}

/** Cumulative business count per month — the growth chart. */
export async function getBusinessGrowth(months = 7) {
  const rows = await db
    .select({
      month: sql<string>`to_char(${businesses.dateRegistered}, 'Mon YYYY')`,
      key: sql<string>`to_char(${businesses.dateRegistered}, 'YYYY-MM')`,
      added: count(businesses.id),
    })
    .from(businesses)
    .groupBy(
      sql`to_char(${businesses.dateRegistered}, 'Mon YYYY')`,
      sql`to_char(${businesses.dateRegistered}, 'YYYY-MM')`,
    )
    .orderBy(sql`to_char(${businesses.dateRegistered}, 'YYYY-MM')`);

  let running = 0;
  return rows
    .map((r) => {
      running += Number(r.added);
      return { month: r.month, key: r.key, added: Number(r.added), total: running };
    })
    .slice(-months);
}

export async function getPlatformSummary() {
  const [row] = await db
    .select({
      total: count(businesses.id),
      active: sql<number>`count(*) filter (where ${businesses.status} = 'active')`,
      suspended: sql<number>`count(*) filter (where ${businesses.status} = 'suspended')`,
      expiring: sql<number>`count(*) filter (where ${businesses.subscriptionStatus} <> 'active')`,
    })
    .from(businesses);

  const [adminRow] = await db
    .select({ admins: count(users.id) })
    .from(users)
    .where(eq(users.role, "admin"));

  // Real platform-wide counts — what the Super Admin dashboard's stat tiles
  // were hardcoding (totalBranches = 18, totalManagers = 24, totalProducts =
  // 3820, totalSales = 41260) instead of ever querying.
  const [branchRow] = await db.select({ total: count(branches.id) }).from(branches);
  const [managerRow] = await db.select({ total: count(users.id) }).from(users).where(eq(users.role, "manager"));
  const [userRow] = await db.select({ total: count(users.id) }).from(users);
  const [productRow] = await db.select({ total: count(products.id) }).from(products);
  const [saleRow] = await db.select({ total: count(sales.id) }).from(sales);
  const [updateRow] = await db.select({ total: count(systemUpdates.id) }).from(systemUpdates);

  return {
    total: Number(row?.total ?? 0),
    active: Number(row?.active ?? 0),
    suspended: Number(row?.suspended ?? 0),
    expiring: Number(row?.expiring ?? 0),
    admins: Number(adminRow?.admins ?? 0),
    branches: Number(branchRow?.total ?? 0),
    managers: Number(managerRow?.total ?? 0),
    users: Number(userRow?.total ?? 0),
    products: Number(productRow?.total ?? 0),
    sales: Number(saleRow?.total ?? 0),
    updates: Number(updateRow?.total ?? 0),
  };
}

export async function getSystemLogs(limit = 50) {
  return db
    .select({
      id: systemLogs.id,
      actor: systemLogs.actor,
      message: systemLogs.message,
      createdAt: systemLogs.createdAt,
    })
    .from(systemLogs)
    .orderBy(desc(systemLogs.createdAt))
    .limit(limit);
}

export async function getSystemUpdates() {
  return db
    .select({
      id: systemUpdates.id,
      fileName: systemUpdates.fileName,
      notes: systemUpdates.notes,
      uploadedAt: systemUpdates.uploadedAt,
    })
    .from(systemUpdates)
    .orderBy(desc(systemUpdates.uploadedAt));
}
