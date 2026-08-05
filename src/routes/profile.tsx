import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserRound, Save } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { currentProfile } from "@/lib/hr-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Meridian POS" },
      { name: "description", content: "Update your account name, email, phone and profile photo." },
      { property: "og:title", content: "My Profile — Meridian POS" },
      { property: "og:description", content: "Update your account name, email, phone and profile photo." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [saved, setSaved] = useState(false);
  const initials = currentProfile.username.split(" ").map((s) => s[0]).join("").slice(0, 2);

  return (
    <AppShell title="Edit Profile" subtitle={`${currentProfile.role} · ${currentProfile.branch}`}>
      <div className="panel mx-auto max-w-xl p-6">
        {saved && (
          <div className="mb-4 rounded-lg bg-success/12 px-4 py-2 text-sm text-success">Profile updated successfully.</div>
        )}
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{currentProfile.username}</p>
            <p className="text-sm text-muted-foreground">{currentProfile.email}</p>
          </div>
        </div>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
          }}
        >
          <div className="grid gap-1.5">
            <Label>Full Name</Label>
            <Input defaultValue={currentProfile.username} name="username" />
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input type="email" defaultValue={currentProfile.email} name="email" />
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input defaultValue={currentProfile.phone} name="phone" />
          </div>
          <div className="grid gap-1.5">
            <Label>Profile Image</Label>
            <Input type="file" name="profile_image" />
          </div>
          <div>
            <Button type="submit" className="rounded-lg"><Save className="size-4" /> Update Profile</Button>
          </div>
        </form>
      </div>
      <div className="mx-auto flex max-w-xl items-center gap-2 text-xs text-muted-foreground">
        <UserRound className="size-3.5" /> Changes apply to your account only.
      </div>
    </AppShell>
  );
}