import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { viewProfile } from "@/db/queries/views";
import ProfilePage from "./profile-client";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Update your account name, email, phone and profile photo.",
};

export default async function Page() {
  const currentProfile = await viewProfile();
  if (!currentProfile) notFound();
  return <ProfilePage currentProfile={currentProfile} />;
}
