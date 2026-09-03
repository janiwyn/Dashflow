"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, ScanBarcode, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { checkSubscriptionPaymentStatus, initiateSubscriptionPayment, type PaymentInput } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/currency";
import { MODULE_LIST, MODULE_TILE_STYLE, modulesMonthlyTotal, type ModuleKey } from "@/lib/modules";
import { annualPrice, PLAN_LIST, type PlanKey } from "@/lib/plans";

type Step = "select" | "pay";
type Mode = "package" | "custom";
type BillingPeriod = "monthly" | "annual";

type Props = {
  initialModules: ModuleKey[];
  /** Modules the signed-in visitor's business already has — offered as "Active", not for sale again. */
  existingModules: ModuleKey[];
  initialPlan: PlanKey | null;
  /** The signed-in visitor's business's current package, if it's on one. */
  existingPlanKey: PlanKey | null;
  /** A signed-in admin/manager adding to their own business, vs. a visitor creating one via /signup. */
  isLoggedIn: boolean;
  /** True when arriving via a "pay/renew" link rather than just browsing plans. */
  renewing: boolean;
  /** Whether the business can still use the app right now — false only when the (app) layout's lockout actually redirected here. */
  stillHasAccess: boolean;
  /** Days left on the current trial/subscription, for the "pay ahead of time" banner. */
  trialDaysLeft: number | null;
};

export default function SubscribePage({
  initialModules,
  existingModules,
  initialPlan,
  existingPlanKey,
  isLoggedIn,
  renewing,
  stillHasAccess,
  trialDaysLeft,
}: Props) {
  const router = useRouter();
  // Packages are the primary path now — only start on the à-la-carte picker
  // if the visitor arrived with specific modules chosen (e.g. from "build
  // your own" on the marketing page), or already runs à la carte with no
  // package at all (someone who signed up with just one module and wants to
  // pay for exactly that shouldn't land on a package picker that doesn't
  // match what they actually have).
  const [mode, setMode] = useState<Mode>(
    initialPlan ? "package" : initialModules.length > 0 || (!existingPlanKey && existingModules.length > 0) ? "custom" : "package",
  );
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initialPlan ?? existingPlanKey ?? "retail");
  const [selected, setSelected] = useState<Set<ModuleKey>>(new Set(initialModules));
  const [step, setStep] = useState<Step>("select");
  const [paying, setPaying] = useState(false);
  const owned = useMemo(() => new Set(existingModules), [existingModules]);

  // What paying actually covers: everything already active plus anything
  // newly picked — not just the new picks. A business that already owns
  // "pos" and adds nothing new is still paying to keep "pos", not paying
  // for zero modules (which used to leave the button permanently disabled
  // for exactly the "pay for what I already signed up with" case).
  const keys = useMemo(() => Array.from(new Set([...existingModules, ...selected])), [existingModules, selected]);
  const customTotal = modulesMonthlyTotal(keys);

  const toggle = (key: ModuleKey) => {
    if (owned.has(key)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const plan = PLAN_LIST.find((p) => p.key === selectedPlan)!;
  const isCustomPricing = mode === "package" && plan.monthlyPrice === null;

  async function onPay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isLoggedIn) {
      // Brand-new businesses get 14 days free before any payment is
      // required (see src/lib/subscription.ts) — nothing to charge yet,
      // just carry the choice through to account creation.
      if (mode === "package") {
        router.push(`/signup?plan=${selectedPlan}&billing=${billing}`);
      } else {
        router.push(`/signup?modules=${keys.join(",")}`);
      }
      return;
    }

    if (isCustomPricing) {
      // Enterprise pricing is negotiated, not auto-charged — this is a lead,
      // not a checkout.
      toast.success("Thanks — our team will reach out shortly to confirm Enterprise pricing.");
      return;
    }

    const phone = String(new FormData(event.currentTarget).get("phone") ?? "").trim();
    setPaying(true);

    const input: PaymentInput = mode === "package" ? { kind: "plan", planKey: selectedPlan, billingPeriod: billing } : { kind: "modules", moduleKeys: keys };
    const started = await initiateSubscriptionPayment(input, phone);
    if (!started.ok) {
      setPaying(false);
      toast.error(started.message);
      return;
    }

    // Mobile money prompts can take a while to approve — poll for up to ~2 minutes.
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      const result = await checkSubscriptionPaymentStatus(started.reference);
      if (result.status === "success") {
        setPaying(false);
        toast.success("Payment confirmed — your plan is active.");
        router.push("/dashboard");
        router.refresh();
        return;
      }
      if (result.status === "failed") {
        setPaying(false);
        toast.error(result.message);
        return;
      }
    }
    setPaying(false);
    toast.error("We didn't get confirmation in time. Check your phone, then try again if it didn't go through.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ScanBarcode className="size-4" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight">
              Dashflow<span className="text-primary"> POS</span>
            </span>
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Back to dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Log in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        {renewing && !stillHasAccess && (
          <div className="mb-8 rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-center text-sm text-warning-foreground">
            <span className="font-semibold">Your free trial has ended.</span> Pick a plan below and pay to keep using Dashflow POS.
          </div>
        )}
        {renewing && stillHasAccess && (
          <div className="mb-8 rounded-2xl border border-success/30 bg-success/10 px-5 py-4 text-center text-sm text-success">
            <span className="font-semibold">
              {trialDaysLeft !== null && trialDaysLeft >= 0
                ? `You still have ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} of access.`
                : "You still have active access."}
            </span>{" "}
            Pay now and it carries straight on — no interruption when it runs out.
          </div>
        )}
        {step === "select" ? (
          mode === "package" ? (
            <PackageStep
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              billing={billing}
              onBillingChange={setBilling}
              existingPlanKey={existingPlanKey}
              hasOtherModules={owned.size > 0}
              onSwitchToCustom={() => setMode("custom")}
              onContinue={() => setStep("pay")}
            />
          ) : (
            <SelectStep
              selected={selected}
              owned={owned}
              total={customTotal}
              canContinue={keys.length > 0}
              isLoggedIn={isLoggedIn}
              onToggle={toggle}
              onSwitchToPackage={() => setMode("package")}
              onContinue={() => setStep("pay")}
            />
          )
        ) : (
          <PayStep
            mode={mode}
            selectedPlan={selectedPlan}
            billing={billing}
            keys={keys}
            total={customTotal}
            paying={paying}
            isLoggedIn={isLoggedIn}
            onBack={() => setStep("select")}
            onPay={onPay}
          />
        )}
      </main>
    </div>
  );
}

function BillingToggle({ billing, onChange }: { billing: BillingPeriod; onChange: (b: BillingPeriod) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {(["monthly", "annual"] as const).map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => onChange(b)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            billing === b ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {b === "monthly" ? "Monthly" : "Annual — 2 months free"}
        </button>
      ))}
    </div>
  );
}

function PackageStep({
  selectedPlan,
  onSelectPlan,
  billing,
  onBillingChange,
  existingPlanKey,
  hasOtherModules,
  onSwitchToCustom,
  onContinue,
}: {
  selectedPlan: PlanKey;
  onSelectPlan: (key: PlanKey) => void;
  billing: BillingPeriod;
  onBillingChange: (b: BillingPeriod) => void;
  existingPlanKey: PlanKey | null;
  hasOtherModules: boolean;
  onSwitchToCustom: () => void;
  onContinue: () => void;
}) {
  const plan = PLAN_LIST.find((p) => p.key === selectedPlan)!;

  return (
    <>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Choose your plan</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick the plan that fits your business
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Every plan gets the full, real version of each module — plans differ in staff logins and branches, not features.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <BillingToggle billing={billing} onChange={onBillingChange} />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PLAN_LIST.map((p) => {
          const active = selectedPlan === p.key;
          const isCurrent = existingPlanKey === p.key;
          const price = p.monthlyPrice !== null ? (billing === "annual" ? annualPrice(p.monthlyPrice) : p.monthlyPrice) : null;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelectPlan(p.key)}
              className={`relative flex flex-col rounded-2xl border p-5 text-left transition-colors ${
                active ? "border-primary bg-accent/50 shadow-card" : "border-border bg-card hover:bg-secondary/50"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{p.label}</span>
                {active && <Check className="size-4 text-primary" />}
              </div>
              <div className="mt-2">
                {price !== null ? (
                  <>
                    <span className="num text-lg font-semibold">{formatMoney(price, "UGX")}</span>
                    <span className="text-xs text-muted-foreground">/{billing === "annual" ? "yr" : "mo"}</span>
                  </>
                ) : (
                  <span className="num text-sm font-semibold">From {formatMoney(p.startingPrice ?? 0, "UGX")}/mo</span>
                )}
              </div>
              {isCurrent && <span className="mt-1 text-[11px] font-medium text-success">Your current plan</span>}
              <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                {p.highlights.slice(0, 3).map((h) => (
                  <li key={h} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                    {h}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {hasOtherModules && (
        <p className="mt-4 rounded-lg bg-warning/10 px-4 py-2.5 text-center text-xs text-warning-foreground">
          Switching plans sets your active modules to exactly what the plan includes — it can drop modules you currently have that aren&apos;t in the new plan.
        </p>
      )}

      <div className="sticky bottom-4 mt-8 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur sm:flex-row sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold">{plan.label}</span> selected
        </p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onSwitchToCustom} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Build your own instead
          </button>
          <Button onClick={onContinue} className="rounded-lg">
            Continue to payment
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

function SelectStep({
  selected,
  owned,
  total,
  canContinue,
  isLoggedIn,
  onToggle,
  onSwitchToPackage,
  onContinue,
}: {
  selected: Set<ModuleKey>;
  owned: Set<ModuleKey>;
  total: number;
  canContinue: boolean;
  isLoggedIn: boolean;
  onToggle: (key: ModuleKey) => void;
  onSwitchToPackage: () => void;
  onContinue: () => void;
}) {
  const totalCount = owned.size + selected.size;
  return (
    <>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Build your own</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          {isLoggedIn ? "Add modules to your business" : "Choose your modules"}
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          {isLoggedIn
            ? "Modules you already subscribe to are marked Active — pay to keep them, and pick more to add to your account."
            : "Pick as many or as few as your business needs today — add the rest later from Settings."}
        </p>
        <button type="button" onClick={onSwitchToPackage} className="mt-3 text-sm font-medium text-primary hover:underline">
          Looking for a package instead?
        </button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MODULE_LIST.map((m) => {
          const active = selected.has(m.key);
          const isOwned = owned.has(m.key);
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onToggle(m.key)}
              disabled={isOwned}
              aria-pressed={active}
              className={`flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-colors ${
                isOwned
                  ? "cursor-default border-success/30 bg-success/5"
                  : active
                    ? "border-primary bg-accent/50 shadow-card"
                    : "border-border bg-card hover:bg-secondary/50"
              }`}
            >
              <span className="relative">
                <span className={`grid size-12 place-items-center rounded-xl ${MODULE_TILE_STYLE[m.key]}`}>
                  <m.icon className="size-5" />
                </span>
                {(active || isOwned) && (
                  <span
                    className={`absolute -right-1 -top-1 grid size-5 place-items-center rounded-full text-primary-foreground ${isOwned ? "bg-success" : "bg-primary"}`}
                  >
                    <Check className="size-3" />
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold tracking-tight">{m.label}</span>
              {isOwned ? (
                <span className="text-xs font-medium text-success">Active</span>
              ) : (
                <span className="num text-xs font-medium text-muted-foreground">
                  {formatMoney(m.monthlyPrice, "UGX")}/mo
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur sm:flex-row sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold">{totalCount}</span> module{totalCount === 1 ? "" : "s"}
          {selected.size > 0 && owned.size > 0 ? ` (${owned.size} active, ${selected.size} new)` : owned.size > 0 ? " active" : " selected"}
          {totalCount > 0 && (
            <span className="num ml-2 font-semibold text-primary">{formatMoney(total, "UGX")}/mo</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {isLoggedIn ? "Not now" : "Skip for now"}
          </Link>
          <Button
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-lg"
          >
            Continue to payment
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

function PayStep({
  mode,
  selectedPlan,
  billing,
  keys,
  total,
  paying,
  isLoggedIn,
  onBack,
  onPay,
}: {
  mode: Mode;
  selectedPlan: PlanKey;
  billing: BillingPeriod;
  keys: ModuleKey[];
  total: number;
  paying: boolean;
  isLoggedIn: boolean;
  onBack: () => void;
  onPay: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const plan = PLAN_LIST.find((p) => p.key === selectedPlan)!;
  const isCustomPricing = mode === "package" && plan.monthlyPrice === null;
  const payTotal = mode === "package" ? (plan.monthlyPrice !== null ? (billing === "annual" ? annualPrice(plan.monthlyPrice) : plan.monthlyPrice) : 0) : total;
  const lineItems = mode === "package" ? plan.moduleKeys : keys;

  return (
    <div className="mx-auto max-w-md">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {mode === "package" ? "Change plan" : "Change modules"}
      </button>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
        {isCustomPricing ? "Talk to our team" : "Confirm your subscription"}
      </h1>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {mode === "package" ? `${plan.label} plan` : "Order summary"}
        </p>
        <ul className="mt-3 divide-y divide-border">
          {lineItems.map((key) => {
            const m = MODULE_LIST.find((x) => x.key === key)!;
            return (
              <li key={key} className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className={`grid size-7 place-items-center rounded-lg ${MODULE_TILE_STYLE[key]}`}>
                    <m.icon className="size-3.5" />
                  </span>
                  {m.label}
                </span>
                {mode === "custom" && <span className="num text-muted-foreground">{formatMoney(m.monthlyPrice, "UGX")}</span>}
              </li>
            );
          })}
        </ul>
        {mode === "package" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Up to {plan.maxUsers ?? "many"} user{plan.maxUsers === 1 ? "" : "s"} ·{" "}
            {plan.maxBranches ? `up to ${plan.maxBranches} branch${plan.maxBranches === 1 ? "" : "es"}` : "multiple branches"}
          </p>
        )}
        {!isCustomPricing && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total{mode === "package" && billing === "annual" ? " (per year)" : ""}</span>
            <span className="num">{formatMoney(payTotal, "UGX")}{mode === "custom" ? "/mo" : billing === "annual" ? "/yr" : "/mo"}</span>
          </div>
        )}
      </div>

      {isCustomPricing ? (
        <div className="mt-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enterprise pricing depends on branches, users and integrations — {isLoggedIn ? "let us know and" : "create your account now and"} our team will follow up to confirm final pricing. Nothing is charged automatically.
          </p>
          <form onSubmit={onPay} method="post">
            <Button type="submit" disabled={paying} className="w-full rounded-lg">
              {isLoggedIn ? "Request Enterprise pricing" : "Create account"}
            </Button>
          </form>
        </div>
      ) : !isLoggedIn ? (
        <form onSubmit={onPay} method="post" className="mt-6 flex flex-col gap-4">
          <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            Free for your first 14 days — no payment needed today.
          </p>
          <Button type="submit" className="rounded-lg">
            Start my free trial
            <ArrowRight className="size-4" />
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" /> You&apos;ll set up your login next — payment only starts after day 14.
          </p>
        </form>
      ) : (
        <form onSubmit={onPay} method="post" className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="momo-phone">Mobile money phone number</Label>
            <Input
              id="momo-phone"
              name="phone"
              required
              className="rounded-lg"
              placeholder="07XX XXX XXX"
            />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Smartphone className="size-3.5" /> We&apos;ll send a payment prompt to this number.
            </p>
          </div>

          <Button type="submit" disabled={paying} className="rounded-lg">
            {paying ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Waiting for confirmation…
              </>
            ) : (
              <>Pay {formatMoney(payTotal, "UGX")} now</>
            )}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" /> This activates on your account immediately after payment.
          </p>
        </form>
      )}
    </div>
  );
}
