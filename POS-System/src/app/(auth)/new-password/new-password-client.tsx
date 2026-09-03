"use client";

import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { setOwnPassword } from "@/app/actions/users";
import { AuthPanel } from "@/components/auth/auth-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_LENGTH = 8;

export default function NewPasswordPage() {
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm_password") ?? "");

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const result = await setOwnPassword(password);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setDone(true);
    router.refresh();
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthPanel
        headline="Choose a new password."
        blurb="You're currently signed in with a temporary password — pick something only you know before continuing."
        footnote={
          <>
            <ShieldCheck className="size-4 shrink-0" />
            At least {MIN_LENGTH} characters.
          </>
        }
      />

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {done ? (
            <>
              <div className="mb-6 grid size-12 place-items-center rounded-xl bg-success/12 text-success">
                <CheckCircle2 className="size-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Password updated</h2>
              <p className="mt-2 text-sm text-muted-foreground">You're all set — continuing to your dashboard.</p>
              <Button asChild className="mt-6 w-full rounded-lg">
                <Link href="/dashboard">Continue</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight">Set a new password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You're using a temporary password — set your own to keep using Dashflow POS.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-destructive/12 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form className="flex flex-col gap-4" method="post" onSubmit={onSubmit}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={MIN_LENGTH}
                      autoComplete="new-password"
                      className="rounded-lg pl-9"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      name="confirm_password"
                      type="password"
                      required
                      minLength={MIN_LENGTH}
                      autoComplete="new-password"
                      className="rounded-lg pl-9"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={pending} className="mt-2 rounded-lg">
                  {pending ? "Updating…" : "Update password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
