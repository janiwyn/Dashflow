import type { Metadata } from "next";

import { configuredProviders } from "@/lib/auth";

import LoginPage from "./login-client";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Secure login portal for Dashflow POS business system.",
};

/**
 * `next` is read here rather than with useSearchParams in the client
 * component: that hook would defer the whole page to the client and ship an
 * empty shell for the app's main entry point.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Only same-origin paths — an absolute URL here would be an open redirect.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return <LoginPage providers={configuredProviders} next={target} />;
}
