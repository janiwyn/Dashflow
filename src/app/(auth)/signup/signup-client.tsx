"use client";

import { ShieldCheck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { finishBusinessSignup } from "@/app/actions/signup";
import { getSession, signUp } from "@/lib/auth-client";
import { formatMoney } from "@/lib/currency";
import { MODULE_CATALOG, modulesMonthlyTotal, type ModuleKey } from "@/lib/modules";
import { annualPrice, PLAN_CATALOG, type PlanKey } from "@/lib/plans";

type Props = {
  providers: ProviderAvailability;
  initialModules: ModuleKey[];
  initialPlan: PlanKey | null;
  initialBilling: "monthly" | "annual";
};

export default function SignupPage({ providers, initialModules, initialPlan, initialBilling }: Props) {
  const router = useRouter();
  const plan = initialPlan ? PLAN_CATALOG[initialPlan] : null;
  const planModules = plan?.moduleKeys ?? initialModules;
  const hasModules = planModules.length > 0;
  const [role, setRole] = useState("admin");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const isCustomPricing = plan?.monthlyPrice === null;
  const monthlyTotal = plan
    ? plan.monthlyPrice ?? 0
    : modulesMonthlyTotal(initialModules);
  const payableTotal = plan && initialBilling === "annual" && plan.monthlyPrice !== null ? annualPrice(plan.monthlyPrice) : monthlyTotal;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    if (password !== String(form.get("confirm_password") ?? "")) {
      setMessage({ text: "Passwords do not match.", error: true });
      return;
    }
    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters.", error: true });
      return;
    }

    setPending(true);
    setMessage(null);

    // Role, business and branch are assigned server-side; the signup payload
    // cannot grant itself privileges (see `input: false` in src/lib/auth.ts).
    const { error } = await signUp.email({
      email: String(form.get("email") ?? "").trim(),
      password,
      name: String(form.get("username") ?? "").trim(),
      username: String(form.get("username") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
    });

    if (error) {
      setPending(false);
      setMessage({ text: error.message ?? "Could not create the account.", error: true });
      return;
    }

    const result = await finishBusinessSignup({
      businessName: String(form.get("business_name") ?? "").trim(),
      role: role === "manager" ? "manager" : "admin",
      moduleKeys: initialModules,
      planKey: initialPlan ?? undefined,
      billingPeriod: initialBilling,
    });

    if (!result.ok) {
      setPending(false);
      setMessage({ text: result.message, error: true });
      return;
    }

    // The session cookie was cached at sign-up, before businessId/role were
    // set — refetch it now (bypassing the cache) so the dashboard the next
    // navigation loads sees the real business instead of falling back.
    await getSession({ query: { disableCookieCache: true } });

    setPending(false);
    setMessage({ text: "Account created. Redirecting…" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthPanel
        headline="Set up your business in minutes."
        blurb="This creates a new business. Once you're in, add branches and staff from Employees — they'll get a login from you directly, no invite codes required."
        footnote={
          <>
            <ShieldCheck className="size-4 shrink-0" />
            Staff and managers don&apos;t sign up here — you create their logins from the Employees page.
          </>
        }
      />

      <div className="flex items-center justify-center overflow-y-auto p-6 sm:p-10">
        <div className="w-full max-w-sm py-6">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Create an account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Join Dashflow POS</p>
          </div>

          {hasModules && (
            <div className="mb-6 rounded-xl border border-primary/25 bg-accent/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                  {plan ? `${plan.label} plan` : "Your subscription"}
                </p>
                {isCustomPricing ? (
                  <p className="num text-sm font-semibold">Custom pricing</p>
                ) : (
                  <p className="num text-sm font-semibold">
                    {formatMoney(payableTotal, "UGX")}
                    {plan ? (initialBilling === "annual" ? "/yr" : "/mo") : "/mo"}
                  </p>
                )}
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {planModules.map((key) => (
                  <li
                    key={key}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium"
                  >
                    {MODULE_CATALOG[key].label}
                  </li>
                ))}
              </ul>
              {plan && (
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Up to {plan.maxUsers ?? "many"} user{plan.maxUsers === 1 ? "" : "s"} ·{" "}
                  {plan.maxBranches ? `up to ${plan.maxBranches} branch${plan.maxBranches === 1 ? "" : "es"}` : "multiple branches"}
                </p>
              )}
              {isCustomPricing && (
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Our team will follow up to confirm final pricing — nothing is charged at signup.
                </p>
              )}
              <p className="mt-2.5 text-xs text-muted-foreground">
                These activate on your new business the moment you sign up.{" "}
                <Link href="/subscribe" className="font-medium text-primary hover:underline">
                  Change modules
                </Link>
              </p>
            </div>
          )}

          {message && (
            <div
              className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
                message.error ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success"
              }`}
            >
              {message.text}
            </div>
          )}

          <ProviderButtons
            available={providers}
            onError={(text) => setMessage({ text, error: true })}
          />

          <AuthDivider label="or sign up with email" />

          <form className="flex flex-col gap-4" method="post" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                required
                className="rounded-lg"
                placeholder="e.g. jkariuki"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-lg"
                placeholder="you@business.co.ke"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required className="rounded-lg" placeholder="0712 345 678" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Your role at this business</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (owner)</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                name="business_name"
                required
                className="rounded-lg"
                placeholder="e.g. Meridian Traders Ltd"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="rounded-lg"
                placeholder="••••••••"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                name="confirm_password"
                type="password"
                required
                minLength={8}
                className="rounded-lg"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={pending} className="mt-2 rounded-lg">
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
