import "server-only";

import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { businesses, customers, products, sales, users } from "@/db/schema";

import { businessScope, enforcedBranchId } from "./_helpers";

const RESULT_LIMIT = 5;

export type ProductResult = { id: number; name: string; sku: string; sellingPrice: number; stock: number };
export type CustomerResult = { id: number; name: string; contact: string | null; accountBalance: number };
export type SaleResult = { id: number; reference: string; customerName: string; total: number; soldAt: Date };
export type BusinessResult = { id: number; name: string; status: string };
export type AdminResult = { id: string; name: string; email: string };

/** Products, customers and recent sales matching `term`, scoped to the signed-in business and (for non-admin roles) their locked branch. */
export async function searchTenant(term: string): Promise<{
  products: ProductResult[];
  customers: CustomerResult[];
  sales: SaleResult[];
}> {
  const businessId = await businessScope();
  const branchId = await enforcedBranchId();
  const like = `%${term}%`;

  const [productRows, customerRows, saleRows] = await Promise.all([
    db
      .select({ id: products.id, name: products.name, sku: products.sku, sellingPrice: products.sellingPrice, stock: products.stock })
      .from(products)
      .where(
        and(
          eq(products.businessId, businessId),
          branchId ? eq(products.branchId, branchId) : undefined,
          or(ilike(products.name, like), ilike(products.sku, like)),
        ),
      )
      .limit(RESULT_LIMIT),
    db
      .select({ id: customers.id, name: customers.name, contact: customers.contact, accountBalance: customers.accountBalance })
      .from(customers)
      .where(and(eq(customers.businessId, businessId), ilike(customers.name, like)))
      .limit(RESULT_LIMIT),
    db
      .select({ id: sales.id, reference: sales.reference, customerName: sales.customerName, total: sales.total, soldAt: sales.soldAt })
      .from(sales)
      .where(
        and(
          eq(sales.businessId, businessId),
          branchId ? eq(sales.branchId, branchId) : undefined,
          or(ilike(sales.reference, like), ilike(sales.customerName, like)),
        ),
      )
      .orderBy(desc(sales.soldAt))
      .limit(RESULT_LIMIT),
  ]);

  return { products: productRows, customers: customerRows, sales: saleRows };
}

/** Businesses and their admins matching `term` — the super-admin variant of search, over the whole platform rather than one tenant. */
export async function searchPlatform(term: string): Promise<{ businesses: BusinessResult[]; admins: AdminResult[] }> {
  const like = `%${term}%`;

  const [businessRows, adminRows] = await Promise.all([
    db
      .select({ id: businesses.id, name: businesses.name, status: businesses.status })
      .from(businesses)
      .where(ilike(businesses.name, like))
      .limit(RESULT_LIMIT),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.role, "admin"), or(ilike(users.name, like), ilike(users.email, like))))
      .limit(RESULT_LIMIT),
  ]);

  return { businesses: businessRows, admins: adminRows };
}
