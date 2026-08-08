import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getBranchById,
  getBranchFinancials,
  getBranchStock,
  getBranchWorkers,
  getBranches,
} from "@/db/queries/branches";

import BranchViewPage from "./branch-view-client";

export const metadata: Metadata = {
  title: "Branch Overview",
  description: "Financial overview, stock and staff for a branch.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const all = await getBranches();
  const branch = (id ? await getBranchById(Number(id)) : null) ?? all[0];
  if (!branch) notFound();

  const [fin, stock, workers] = await Promise.all([
    getBranchFinancials(branch.id),
    getBranchStock(branch.id),
    getBranchWorkers(branch.id),
  ]);

  return <BranchViewPage branch={branch} fin={fin} stock={stock} workers={workers} />;
}
