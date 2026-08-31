"use server";

import { searchPlatform, searchTenant } from "@/db/queries/search";
import { getCurrentUser } from "@/lib/session";

export type GlobalSearchResult =
  | { kind: "tenant"; products: Awaited<ReturnType<typeof searchTenant>>["products"]; customers: Awaited<ReturnType<typeof searchTenant>>["customers"]; sales: Awaited<ReturnType<typeof searchTenant>>["sales"] }
  | { kind: "platform"; businesses: Awaited<ReturnType<typeof searchPlatform>>["businesses"]; admins: Awaited<ReturnType<typeof searchPlatform>>["admins"] };

const EMPTY_TENANT: GlobalSearchResult = { kind: "tenant", products: [], customers: [], sales: [] };
const EMPTY_PLATFORM: GlobalSearchResult = { kind: "platform", businesses: [], admins: [] };

/** Backs the header search bar. Requires 2+ characters so every keystroke doesn't fire a full-table scan. */
export async function globalSearch(rawQuery: string): Promise<GlobalSearchResult> {
  const user = await getCurrentUser();
  const term = rawQuery.trim();
  const isSuper = user?.role === "super";

  if (!user || term.length < 2) return isSuper ? EMPTY_PLATFORM : EMPTY_TENANT;

  if (isSuper) {
    const result = await searchPlatform(term);
    return { kind: "platform", ...result };
  }

  const result = await searchTenant(term);
  return { kind: "tenant", ...result };
}
