import "server-only";

import { and, asc, count, desc, eq, isNotNull, lte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { branches, categories, products, suppliers } from "@/db/schema";

import { businessScope, enforcedBranchId, num } from "./_helpers";

export type ProductRow = {
  id: number;
  sku: string;
  name: string;
  category: string;
  categoryId: number | null;
  branch: string;
  branchId: number | null;
  sellingPrice: number;
  buyingPrice: number;
  stock: number;
  lowStockThreshold: number;
  expiryDate: string | null;
  imagePath: string | null;
};

const productSelect = {
  id: products.id,
  sku: products.sku,
  name: products.name,
  category: sql<string>`coalesce(${categories.name}, 'Uncategorised')`.as("category"),
  categoryId: products.categoryId,
  branch: sql<string>`coalesce(${branches.name}, 'Unassigned')`.as("branch"),
  branchId: products.branchId,
  sellingPrice: products.sellingPrice,
  buyingPrice: products.buyingPrice,
  stock: products.stock,
  lowStockThreshold: products.lowStockThreshold,
  expiryDate: products.expiryDate,
  imagePath: products.imagePath,
};

export async function getProducts(options?: { branchId?: number }): Promise<ProductRow[]> {
  const businessId = await businessScope();
  const branchId = await enforcedBranchId(options?.branchId);
  const where = branchId
    ? and(eq(products.businessId, businessId), eq(products.branchId, branchId))
    : eq(products.businessId, businessId);

  return db
    .select(productSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(branches, eq(products.branchId, branches.id))
    .where(where)
    .orderBy(desc(products.id));
}

export async function getProductById(id: number): Promise<ProductRow | null> {
  const businessId = await businessScope();
  const [row] = await db
    .select(productSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(branches, eq(products.branchId, branches.id))
    .where(and(eq(products.businessId, businessId), eq(products.id, id)))
    .limit(1);
  return row ?? null;
}

/** Products at or below their reorder threshold, most urgent first. */
export async function getLowStockProducts(): Promise<ProductRow[]> {
  const businessId = await businessScope();
  return db
    .select(productSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(branches, eq(products.branchId, branches.id))
    .where(
      and(
        eq(products.businessId, businessId),
        lte(products.stock, products.lowStockThreshold),
      ),
    )
    .orderBy(asc(products.stock));
}

/** Dated stock expiring within `days`, soonest first. */
export async function getExpiringProducts(days = 30): Promise<ProductRow[]> {
  const businessId = await businessScope();
  return db
    .select(productSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(branches, eq(products.branchId, branches.id))
    .where(
      and(
        eq(products.businessId, businessId),
        isNotNull(products.expiryDate),
        lte(products.expiryDate, sql`current_date + ${days}::int`),
      ),
    )
    .orderBy(asc(products.expiryDate));
}

export async function getCategories() {
  const businessId = await businessScope();
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.businessId, businessId))
    .orderBy(asc(categories.name));
}

/** Category names with an "All" sentinel, matching the POS filter chips. */
export async function getCategoryNames(): Promise<string[]> {
  const rows = await getCategories();
  return ["All", ...rows.map((c) => c.name)];
}

export async function getSuppliers() {
  const businessId = await businessScope();
  const rows = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      category: sql<string>`coalesce(${categories.name}, 'General')`.as("category"),
      contact: suppliers.contact,
      email: suppliers.email,
      lastDelivery: suppliers.lastDelivery,
      payable: suppliers.payable,
    })
    .from(suppliers)
    .leftJoin(categories, eq(suppliers.categoryId, categories.id))
    .where(eq(suppliers.businessId, businessId))
    .orderBy(desc(suppliers.payable));
  return rows;
}

export async function getInventorySummary() {
  const businessId = await businessScope();
  const branchId = await enforcedBranchId();
  const where = branchId
    ? and(eq(products.businessId, businessId), eq(products.branchId, branchId))
    : eq(products.businessId, businessId);

  const [row] = await db
    .select({
      skuCount: count(products.id),
      stockUnits: sum(products.stock).mapWith(Number),
      retailValue: sql<number>`coalesce(sum(${products.sellingPrice} * ${products.stock}), 0)`,
      costValue: sql<number>`coalesce(sum(${products.buyingPrice} * ${products.stock}), 0)`,
      lowStock: sql<number>`count(*) filter (where ${products.stock} <= ${products.lowStockThreshold})`,
    })
    .from(products)
    .where(where);

  return {
    skuCount: num(row?.skuCount),
    stockUnits: num(row?.stockUnits),
    retailValue: num(row?.retailValue),
    costValue: num(row?.costValue),
    lowStock: num(row?.lowStock),
  };
}
