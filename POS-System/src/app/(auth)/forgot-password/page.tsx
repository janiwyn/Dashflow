import type { Metadata } from "next";

import ForgotPasswordPage from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your Meridian POS account.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
