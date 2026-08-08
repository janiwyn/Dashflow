"use client";

import { ArrowLeft, KeyRound, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const address = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const { error: resetError } = await requestPasswordReset({
      email: address,
      redirectTo: "/new-password",
    });

    setPending(false);

    if (resetError) {
      setError(resetError.message ?? "Could not send the reset link. Try again.");
      return;
    }

    // Always report success: revealing which addresses exist would let anyone
    // enumerate accounts from this form.
    setEmail(address);
    setSent(true);
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthPanel
        headline="Locked out? It happens."
        blurb="We'll email you a single-use link to set a new password. The link expires in one hour."
        footnote={
          <>
            <KeyRound className="size-4 shrink-0" />
            Reset links can only be used once.
          </>
        }
      />

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {sent ? (
            <>
              <div className="mb-6 grid size-12 place-items-center rounded-xl bg-success/12 text-success">
                <MailCheck className="size-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Check your inbox</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>
                , we&apos;ve sent a link to reset your password.
              </p>
              <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
                No mail provider is configured in development — the reset link is printed to the
                server console.
              </p>
              <Button asChild variant="secondary" className="mt-6 w-full rounded-lg">
                <Link href="/login">
                  <ArrowLeft className="size-4" /> Back to sign in
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight">Forgot your password?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the email on your account and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-destructive/12 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form className="flex flex-col gap-4" onSubmit={onSubmit}>
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

                <Button type="submit" disabled={pending} className="mt-2 rounded-lg">
                  {pending ? "Sending…" : "Send reset link"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
