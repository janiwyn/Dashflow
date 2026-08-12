"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { createBranch } from "@/app/actions/branches";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function CreateBranchPage() {
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(null);

    startTransition(async () => {
      const result = await createBranch({
        name: String(form.get("name") ?? ""),
        location: String(form.get("location") ?? ""),
        contact: String(form.get("contact") ?? ""),
        managerName: String(form.get("manager") ?? ""),
      });

      if (!result.ok) {
        setMessage({ text: result.message, error: true });
        return;
      }

      setMessage({ text: result.message });
      router.push("/list-branches");
      router.refresh();
    });
  };

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
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
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
            <Label htmlFor="manager">Manager (optional)</Label>
            <Input id="manager" name="manager" placeholder="Assigned later if left blank" />
          </div>
          <Button type="submit" disabled={pending} className="mt-2 rounded-lg">
            {pending ? "Creating…" : "Create branch"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
