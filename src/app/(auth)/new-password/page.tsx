import type { Metadata } from "next";

import { requireUser } from "@/lib/session";

import NewPasswordPage from "./new-password-client";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Dashflow POS account.",
};

/** Reached only by a signed-in user — after an SMS password reset (or an admin's reset) leaves them on a temporary password, requireUser() is what actually gates this. */
export default async function Page() {
  await requireUser();
  return <NewPasswordPage />;
}
