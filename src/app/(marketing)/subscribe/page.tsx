import type { Metadata } from "next";

import { parseModuleKeys } from "@/lib/modules";

import SubscribePage from "./subscribe-client";

export const metadata: Metadata = {
  title: "Subscribe — Dashflow POS",
  description: "Choose the modules your business needs and see the price before you sign up.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ modules?: string }>;
}) {
  const { modules } = await searchParams;
  return <SubscribePage initialModules={parseModuleKeys(modules)} />;
}
