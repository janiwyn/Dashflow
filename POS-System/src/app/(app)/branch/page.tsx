import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getBranchById,
  getBranchFinancials,
  getBranchWorkers,
  getBranches,
} from "@/db/queries/branches";
import { getPaymentMix, getRevenueSeries } from "@/db/queries/sales";

import BranchPage from "./branch-client";

export const metadata: Metadata = {
  title: "Branch Dashboard",
  description: "Branch-level financial overview with sales trend and payment mix.",
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

  const [fin, workers, revenueSeries, paymentMix] = await Promise.all([
    getBranchFinancials(branch.id),
    getBranchWorkers(branch.id),
    getRevenueSeries(7),
    getPaymentMix(branch.id),
  ]);

  return (
    <BranchPage
      branch={branch}
      branches={branches}
      fin={fin}
      workers={workers}
      revenueSeries={revenueSeries}
      paymentMix={paymentMix}
    />
  );
}
