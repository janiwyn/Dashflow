"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";

import { updateBranch } from "@/app/actions/branches";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BranchRow } from "@/db/queries/branches";

export default function BranchEditPage({ branch }: { branch: BranchRow }) {
  const [name, setName] = useState(branch.name);
  const [location, setLocation] = useState(branch.location ?? "");
  const [contact, setContact] = useState(branch.contact ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await updateBranch({ id: branch.id, name, location, contact });
      if (result.ok) setMessage(result.message);
      else setError(result.message);
    });
  }

  return (
    <AppShell
      title="Edit Branch"
      subtitle={branch.name}
      actions={
        <Link href="/list-branches">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="size-4" /> Back
          </Button>
        </Link>
      }
    >
      <div className="panel mx-auto w-full max-w-lg p-6">
        {message && (
          <div className="mb-4 rounded-lg bg-success/12 px-4 py-2.5 text-sm text-success">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/12 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}
        <form className="flex flex-col gap-4" method="post" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Branch name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact">Contact</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pending} className="rounded-lg">
              {pending ? "Saving…" : "Update branch"}
            </Button>
            <Link href="/list-branches">
              <Button type="button" variant="secondary" className="rounded-lg">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
