"use client";

import { ArrowLeft, CheckCircle2, KeyRound, Lock, Mail, MessageSquareText, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { requestSmsPasswordReset, verifyAndSetPassword } from "@/app/actions/users";
import { AuthPanel } from "@/components/auth/auth-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_LENGTH = 8;
type Step = "request" | "verify" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const number = String(new FormData(event.currentTarget).get("phone") ?? "").trim();
    const result = await requestSmsPasswordReset(number);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setPhone(number);
    setStep("verify");
  }

  async function onVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();
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
    const result = await verifyAndSetPassword({ phone, email, code, newPassword: password });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setStep("done");
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthPanel
        headline="Locked out? It happens."
        blurb="We'll text a verification code to your phone — enter it here to set a new password, right from this page."
        footnote={
          <>
            <KeyRound className="size-4 shrink-0" />
            Codes expire after 15 minutes.
          </>
        }
      />

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {step === "done" ? (
            <>
              <div className="mb-6 grid size-12 place-items-center rounded-xl bg-success/12 text-success">
                <CheckCircle2 className="size-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Password set</h2>
              <p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p>
              <Button asChild className="mt-6 w-full rounded-lg">
                <Link href="/login">Go to sign in</Link>
              </Button>
            </>
          ) : step === "verify" ? (
            <>
              <div className="mb-8 text-center lg:text-left">
                <div className="mb-4 grid size-12 place-items-center rounded-xl bg-success/12 text-success lg:mx-0">
                  <MessageSquareText className="size-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Enter your code</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We texted a 6-digit code to <span className="font-medium text-foreground">{phone}</span>. Enter it below with the account&apos;s email and your new password.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-destructive/12 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form className="flex flex-col gap-4" method="post" onSubmit={onVerify}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reset-email">Account email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
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
                  <Label htmlFor="code">Verification code</Label>
                  <Input
                    id="code"
                    name="code"
                    inputMode="numeric"
                    required
                    autoComplete="one-time-code"
                    className="rounded-lg text-center tracking-[0.3em]"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

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
                  {pending ? "Setting password…" : "Set new password"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <button type="button" onClick={() => setStep("request")} className="font-medium text-primary hover:underline">
                  Use a different number
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight">Forgot your password?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the phone number on your account and we&apos;ll text you a code.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-destructive/12 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form className="flex flex-col gap-4" method="post" onSubmit={onRequest}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      className="rounded-lg pl-9"
                      placeholder="07XX XXX XXX"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={pending} className="mt-2 rounded-lg">
                  {pending ? "Sending…" : "Send verification code"}
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

          {step !== "done" && step !== "request" && (
            <p className="mt-3 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
