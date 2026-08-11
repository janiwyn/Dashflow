"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, ScanBarcode, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { addModulesToMyBusiness } from "@/app/actions/subscribe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/currency";
import { MODULE_LIST, MODULE_TILE_STYLE, modulesMonthlyTotal, type ModuleKey } from "@/lib/modules";

type Step = "select" | "pay";

type Props = {
  initialModules: ModuleKey[];
  /** Modules the signed-in visitor's business already has — offered as "Active", not for sale again. */
  existingModules: ModuleKey[];
  /** A signed-in admin/manager adding to their own business, vs. a visitor creating one via /signup. */
  isLoggedIn: boolean;
};

export default function SubscribePage({ initialModules, existingModules, isLoggedIn }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<ModuleKey>>(new Set(initialModules));
  const [step, setStep] = useState<Step>("select");
  const [paying, setPaying] = useState(false);
  const owned = useMemo(() => new Set(existingModules), [existingModules]);

  const keys = useMemo(() => Array.from(selected), [selected]);
  const total = modulesMonthlyTotal(keys);

  const toggle = (key: ModuleKey) => {
    if (owned.has(key)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  async function onPay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaying(true);
    // No live payment gateway is wired up yet — this stands in for the
    // M-Pesa STK push confirmation so the flow can be built and tested end
    // to end. Swap for a real charge before going live.
    await new Promise((resolve) => setTimeout(resolve, 1300));

    if (isLoggedIn) {
      // Already have an account — add straight to it instead of routing
      // through /signup, which would just bounce a signed-in visitor to
      // /dashboard and silently drop the modules they just "paid" for.
      const result = await addModulesToMyBusiness(keys);
      setPaying(false);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    router.push(`/signup?modules=${keys.join(",")}`);
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
        {step === "select" ? (
          <SelectStep
            selected={selected}
            owned={owned}
            total={total}
            isLoggedIn={isLoggedIn}
            onToggle={toggle}
            onContinue={() => setStep("pay")}
          />
        ) : (
          <PayStep
            keys={keys}
            total={total}
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

function SelectStep({
  selected,
  owned,
  total,
  isLoggedIn,
  onToggle,
  onContinue,
}: {
  selected: Set<ModuleKey>;
  owned: Set<ModuleKey>;
  total: number;
  isLoggedIn: boolean;
  onToggle: (key: ModuleKey) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Subscribe</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          {isLoggedIn ? "Add modules to your business" : "Choose your modules"}
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          {isLoggedIn
            ? "Modules you already subscribe to are marked Active. Pick more to add them to your account."
            : "Pick as many or as few as your business needs today — add the rest later from Settings."}
        </p>
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
                  {formatMoney(m.monthlyPrice, "KES")}/mo
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur sm:flex-row sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold">{selected.size}</span> module{selected.size === 1 ? "" : "s"} selected
          {selected.size > 0 && (
            <span className="num ml-2 font-semibold text-primary">{formatMoney(total, "KES")}/mo</span>
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
            disabled={selected.size === 0}
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
  keys,
  total,
  paying,
  isLoggedIn,
  onBack,
  onPay,
}: {
  keys: ModuleKey[];
  total: number;
  paying: boolean;
  isLoggedIn: boolean;
  onBack: () => void;
  onPay: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="mx-auto max-w-md">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Change modules
      </button>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
        Confirm your subscription
      </h1>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Order summary</p>
        <ul className="mt-3 divide-y divide-border">
          {keys.map((key) => {
            const m = MODULE_LIST.find((x) => x.key === key)!;
            return (
              <li key={key} className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className={`grid size-7 place-items-center rounded-lg ${MODULE_TILE_STYLE[key]}`}>
                    <m.icon className="size-3.5" />
                  </span>
                  {m.label}
                </span>
                <span className="num text-muted-foreground">{formatMoney(m.monthlyPrice, "KES")}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
          <span>Total</span>
          <span className="num">{formatMoney(total, "KES")}/mo</span>
        </div>
      </div>

      <form onSubmit={onPay} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
          <Input
            id="mpesa-phone"
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
            <>Pay {formatMoney(total, "KES")} now</>
          )}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          {isLoggedIn
            ? "These activate on your account immediately after payment."
            : "You'll set up your login right after payment."}
        </p>
      </form>
    </div>
  );
}
