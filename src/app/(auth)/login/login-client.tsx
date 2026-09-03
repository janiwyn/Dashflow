"use client";

import { Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";
import {
  AuthDivider,
  ProviderButtons,
  type ProviderAvailability,
} from "@/components/auth/provider-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export default function LoginPage({
  providers,
  next,
}: {
  providers: ProviderAvailability;
  next: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const { error: authError } = await signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });

    if (authError) {
      setError(authError.message ?? "Invalid email or password");
      setPending(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthPanel
        headline="Run every branch from one dashboard."
        blurb="Sales, stock, expenses and staff performance across all your locations in Uganda — in real time."
        footnote={
          <>
            <ShieldCheck className="size-4 shrink-0" />
            Secure, role-based access for admins, managers and staff.
          </>
        }
      />

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Business System</h2>
            <p className="mt-1 text-sm text-muted-foreground">Secure login portal</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/12 px-4 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <ProviderButtons available={providers} callbackURL={next} onError={setError} />

          <AuthDivider label="or sign in with email" />

          <form className="flex flex-col gap-4" method="post" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="rounded-lg pl-9"
                  placeholder="you@business.co.ke"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="rounded-lg pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" disabled={pending} className="mt-2 rounded-lg">
              {pending ? "Signing in…" : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
