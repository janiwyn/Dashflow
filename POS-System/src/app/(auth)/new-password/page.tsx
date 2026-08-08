import type { Metadata } from "next";

import NewPasswordPage from "./new-password-client";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Meridian POS account.",
};

/** Reading the token server-side keeps the form in the SSR payload. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  return <NewPasswordPage token={token ?? null} linkError={error ?? null} />;
}
