import type { Metadata } from "next";

import { db } from "@/db";
import { branches } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

import { configuredProviders } from "@/lib/auth";

import SignupPage from "./signup-client";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a new admin, manager or staff account for Meridian POS.",
};

export default async function Page() {
  // Signup is public, so this cannot use the tenant-scoped query layer.
  const rows = await db
    .select({ id: branches.id, name: branches.name })
    .from(branches)
    .where(eq(branches.businessId, 1))
    .orderBy(asc(branches.id));

  return <SignupPage branches={rows} providers={configuredProviders} />;
}
