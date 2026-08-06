import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBranchById, getBranches } from "@/db/queries/branches";

import BranchEditPage from "./branch-edit-client";

export const metadata: Metadata = {
  title: "Edit Branch",
  description: "Update a branch's name, location and contact details.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const branches = await getBranches();
  const branch = (id ? await getBranchById(Number(id)) : null) ?? branches[0];
  if (!branch) notFound();

  return <BranchEditPage branch={branch} />;
}
