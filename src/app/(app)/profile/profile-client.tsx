"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRound, Save } from "lucide-react";

import { updateOwnProfile } from "@/app/actions/users";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { viewProfile } from "@/db/queries/views";

type Props = {
  currentProfile: NonNullable<Awaited<ReturnType<typeof viewProfile>>>;
};

export default function ProfilePage({ currentProfile }: Props) {
  const router = useRouter();
  // The original form bound this field (and the header) to currentProfile.username — the
  // separate login-handle column, e.g. "admin" — not the real display name ("Meridian
  // Admin"). Saving silently overwrote users.name with whatever the username field held.
  // updateOwnProfile only ever writes `name`, so this field has to reflect that column.
  const [name, setName] = useState(currentProfile.name);
  const [phone, setPhone] = useState(currentProfile.phone === "—" ? "" : currentProfile.phone);
  const [pending, startTransition] = useTransition();
  const initials = currentProfile.name.split(" ").map((s) => s[0]).join("").slice(0, 2);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateOwnProfile({ name: name.trim(), phone: phone.trim() });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  return (
    <AppShell title="Edit Profile" subtitle={`${currentProfile.role} · ${currentProfile.branch}`}>
      <div className="panel mx-auto max-w-xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{currentProfile.name}</p>
            <p className="text-sm text-muted-foreground">{currentProfile.email}</p>
            {currentProfile.hireDate && (
              <p className="text-xs text-muted-foreground">Member since {currentProfile.hireDate}</p>
            )}
          </div>
        </div>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-1.5">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} name="name" />
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input type="email" defaultValue={currentProfile.email} name="email" disabled />
            <p className="text-xs text-muted-foreground">Email is your sign-in identity and can&apos;t be changed here.</p>
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} name="phone" />
          </div>
          <div>
            <Button type="submit" disabled={pending} className="rounded-lg">
              <Save className="size-4" /> {pending ? "Saving…" : "Update Profile"}
            </Button>
          </div>
        </form>
      </div>
      <div className="mx-auto flex max-w-xl items-center gap-2 text-xs text-muted-foreground">
        <UserRound className="size-3.5" /> Changes apply to your account only.
      </div>
    </AppShell>
  );
}
