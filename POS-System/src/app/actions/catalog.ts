"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { branches, categories, products } from "@/db/schema";
import { requireRole } from "@/lib/session";

import type { ActionResult } from "./users";

async function resolveCategoryId(businessId: number, name: string) {
  const clean = name.trim() || "Uncategorised";
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.businessId, businessId), eq(categories.name, clean)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(categories)
    .values({ businessId, name: clean })
    .returning({ id: categories.id });
  return created.id;
}

async function resolveBranchId(businessId: number, name: string) {
  const [row] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(and(eq(branches.businessId, businessId), eq(branches.name, name.trim())))
    .limit(1);
  return row?.id ?? null;
}

export async function createProduct(input: {
  name: string;
  category: string;
  sellingPrice: number;
  buyingPrice: number;
  stock: number;
  branch: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  if (!input.name.trim()) return { ok: false, message: "Product name is required." };
  if (input.sellingPrice <= 0) return { ok: false, message: "Selling price must be greater than 0." };

  const [categoryId, branchId] = await Promise.all([
    resolveCategoryId(businessId, input.category),
    resolveBranchId(businessId, input.branch),
  ]);

  // SKUs follow the P-#### convention the receipts and dashboard display.
  const [last] = await db
    .select({ id: products.id })
    .from(products)
    .orderBy(products.id)
    .limit(1);
  const sku = `P-${1000 + (last?.id ?? 0) + Math.floor(Math.random() * 900) + 41}`;

  await db.insert(products).values({
    businessId,
    branchId,
    categoryId,
    sku,
    name: input.name.trim(),
    sellingPrice: input.sellingPrice,
    buyingPrice: input.buyingPrice,
    stock: input.stock,
  });

  revalidatePath("/products");
  revalidatePath("/inventory");
  return { ok: true, message: `${input.name} added to the catalogue.` };
}

export async function updateProduct(input: {
  id: number;
  name?: string;
  sellingPrice?: number;
  buyingPrice?: number;
  stock?: number;
  expiryDate?: string | null;
  branch?: string;
}): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const branchId = input.branch ? await resolveBranchId(businessId, input.branch) : undefined;

  const [updated] = await db
    .update(products)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.sellingPrice !== undefined ? { sellingPrice: input.sellingPrice } : {}),
      ...(input.buyingPrice !== undefined ? { buyingPrice: input.buyingPrice } : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.expiryDate !== undefined ? { expiryDate: input.expiryDate } : {}),
      ...(branchId !== undefined ? { branchId } : {}),
    })
    .where(and(eq(products.id, input.id), eq(products.businessId, businessId)))
    .returning({ id: products.id });

  if (!updated) return { ok: false, message: "Product not found." };

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/edit-product");
  return { ok: true, message: "Product updated." };
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  const [deleted] = await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.businessId, businessId)))
    .returning({ id: products.id });

  if (!deleted) return { ok: false, message: "Product not found." };

  revalidatePath("/products");
  revalidatePath("/inventory");
  return { ok: true, message: "Product removed." };
}

export async function setProductImage(id: number, imagePath: string): Promise<ActionResult> {
  const actor = await requireRole("super", "admin", "manager");
  const businessId = actor.businessId ?? 1;

  await db
    .update(products)
    .set({ imagePath })
    .where(and(eq(products.id, id), eq(products.businessId, businessId)));

  revalidatePath("/product-images");
  return { ok: true, message: "Product image updated." };
}
