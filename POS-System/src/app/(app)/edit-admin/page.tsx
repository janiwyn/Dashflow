import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAdminById, getAdmins } from "@/db/queries/super-admin";
import { requireRole } from "@/lib/session";

import EditAdminPage from "./edit-admin-client";

export const metadata: Metadata = {
  title: "Edit Admin",
  description: "Update a business admin's email address and role.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireRole("super");
  const { id } = await searchParams;
  const all = await getAdmins();
  const admin = (id ? await getAdminById(id) : null) ?? all[0];
  if (!admin) notFound();

  return <EditAdminPage admin={admin} />;
}
