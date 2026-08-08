import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBusinessById, getBusinesses } from "@/db/queries/super-admin";
import { requireRole } from "@/lib/session";

import EditBusinessPage from "./edit-business-client";

export const metadata: Metadata = {
  title: "Edit Business",
  description: "Update business name, email and phone number.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireRole("super");
  const { id } = await searchParams;
  const all = await getBusinesses();
  const business = (id ? await getBusinessById(Number(id)) : null) ?? all[0];
  if (!business) notFound();

  return <EditBusinessPage business={business} />;
}
