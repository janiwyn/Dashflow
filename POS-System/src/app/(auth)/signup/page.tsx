import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { configuredProviders } from "@/lib/auth";
import { parseModuleKeys } from "@/lib/modules";
import { getCurrentUser } from "@/lib/session";

import SignupPage from "./signup-client";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a new business on Dashflow POS.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ modules?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { modules } = await searchParams;
  const initialModules = parseModuleKeys(modules);

  return <SignupPage providers={configuredProviders} initialModules={initialModules} />;
}
