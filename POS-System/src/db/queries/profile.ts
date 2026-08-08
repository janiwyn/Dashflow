import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { branches, businesses, employees, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

/** The signed-in user's profile, joined with their branch, business and HR record. */
export async function getProfile() {
  const current = await getCurrentUser();
  if (!current) return null;

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      branch: branches.name,
      branchId: users.branchId,
      business: businesses.name,
      businessId: users.businessId,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(branches, eq(users.branchId, branches.id))
    .leftJoin(businesses, eq(users.businessId, businesses.id))
    .where(eq(users.id, current.id))
    .limit(1);

  if (!row) return null;

  const [employee] = await db
    .select({ position: employees.position, hireDate: employees.hireDate })
    .from(employees)
    .where(eq(employees.userId, current.id))
    .limit(1);

  return { ...row, position: employee?.position ?? null, hireDate: employee?.hireDate ?? null };
}

export async function getBusinessProfile() {
  const current = await getCurrentUser();
  const businessId = current?.businessId ?? 1;
  const [row] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  return row ?? null;
}
