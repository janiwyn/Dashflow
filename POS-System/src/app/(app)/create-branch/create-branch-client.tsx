"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function CreateBranchPage() {
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  return (
    <AppShell
      title="Add Branch"
      subtitle="Register a new branch for your business"
      actions={
        <Link href="/list-branches">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="size-4" /> Back to branches
          </Button>
        </Link>
      }
    >
      <div className="panel mx-auto w-full max-w-lg p-6">
        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
              message.error ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success"
            }`}
          >
            {message.text}
          </div>
        )}
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage({ text: "Branch created successfully!" });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Branch name</Label>
            <Input id="name" name="name" required placeholder="e.g. Eldoret — Town Centre" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" required placeholder="e.g. Uganda Rd, Eldoret" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact">Contact</Label>
            <Input id="contact" name="contact" required placeholder="0712 345 678" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch-key">Branch key</Label>
            <Input id="branch-key" name="branch-key" required placeholder="Used by staff to sign up to this branch" />
          </div>
          <Button type="submit" className="mt-2 rounded-lg">
            Create branch
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
