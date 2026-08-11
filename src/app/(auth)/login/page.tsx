import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { configuredProviders } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";

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
  // Defaults to /dashboard, not "/": the marketing homepage no longer
  // bounces a signed-in visitor away, so a bare /login (no ?next=, e.g. from
  // clicking "Log in" in the nav) has to send them into the app itself.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  // A validated check, unlike middleware's cookie-presence check — this is
  // what actually redirects an already-signed-in visitor away from the form,
  // without risking a bounce loop when a stale cookie has no live session.
  const user = await getCurrentUser();
  if (user) redirect(target);

  return <LoginPage providers={configuredProviders} next={target} />;
}
