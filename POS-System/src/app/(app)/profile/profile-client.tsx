"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CalendarDays, Mail, Save, UserRound } from "lucide-react";

import { updateOwnProfile } from "@/app/actions/users";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { viewProfile } from "@/db/queries/views";

type Props = {
  currentProfile: NonNullable<Awaited<ReturnType<typeof viewProfile>>>;
};

export default function ProfilePage({ currentProfile }: Props) {
  const router = useRouter();
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
    <AppShell title="Edit Profile" subtitle="Manage your personal account details">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Identity summary */}
        <div className="panel h-fit overflow-hidden">
          <div className="h-20 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
          <div className="-mt-10 px-6 pb-6">
            <Avatar className="size-20 border-4 border-card shadow-card">
              <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <p className="mt-3 truncate text-lg font-semibold tracking-tight">{currentProfile.name}</p>
            <Badge variant="secondary" className="mt-1.5">
              {currentProfile.role}
            </Badge>

            <div className="mt-5 grid gap-3 border-t border-border pt-5 text-sm">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span className="truncate">{currentProfile.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Building2 className="size-4 shrink-0" />
                <span className="truncate">{currentProfile.branch}</span>
              </div>
              {currentProfile.hireDate && (
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <CalendarDays className="size-4 shrink-0" />
                  <span className="truncate">Member since {currentProfile.hireDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editable details */}
        <div className="panel min-w-0 p-6">
          <div className="mb-5 flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Personal information</h2>
          </div>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} name="name" className="rounded-lg" />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} name="phone" className="rounded-lg" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input type="email" defaultValue={currentProfile.email} name="email" disabled className="rounded-lg" />
              <p className="text-xs text-muted-foreground">Email is your sign-in identity and can&apos;t be changed here.</p>
            </div>

            <div className="flex flex-col-reverse items-start gap-3 border-t border-border pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">Changes apply to your account only.</p>
              <Button type="submit" disabled={pending} className="rounded-lg">
                <Save className="size-4" /> {pending ? "Saving…" : "Update Profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
