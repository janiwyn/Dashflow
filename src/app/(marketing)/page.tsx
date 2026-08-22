import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Boxes,
  HandCoins,
  ScanBarcode,
  LineChart,
  Phone,
  Smartphone,
  MessageCircleQuestion,
  Wallet,
  Printer,
  Package,
  Fingerprint,
} from "lucide-react";

import { HexMark } from "@/components/brand-mark";
import { formatMoney } from "@/lib/currency";
import { MODULE_LIST, MODULE_TILE_STYLE } from "@/lib/modules";
import { PLAN_LIST } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";

import { MobileNav } from "./mobile-nav";

export const metadata: Metadata = {
  title: "Dashflow POS \u2014 Run every branch from one dashboard",
  description:
    "Point of sale, inventory, staff and multi-branch reporting for wholesale, supermarkets and retail businesses across Kenya, Uganda, Tanzania, Rwanda, Nigeria and Ghana \u2014 in your own currency.",
};

const CITIES = ["Nairobi", "Kampala", "Dar es Salaam", "Kigali", "Lagos", "Accra", "Mombasa", "Jinja"];

export default async function MarketingHome() {
  // Signed-in visitors can still browse the marketing site \u2014 like most SaaS
  // sites, the nav just reflects that they're already in rather than
  // pretending they're not (or, as this used to do, redirecting them away
  // from the homepage before they could see it at all).
  const user = await getCurrentUser();

  return (
    <div className="bg-background text-foreground">
      <SiteNav user={user} />
      <Hero user={user} />
      <CityMarquee />
      <PhotoStrip />
      <PackagesGrid />
      <ModulesGrid />
      <OldVsNew />
      <Showcases />
      <HardwareShowcase />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

/* ---------------------------------- Nav ---------------------------------- */

function SiteNav({ user }: { user: Awaited<ReturnType<typeof getCurrentUser>> }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 shadow-[0_1px_0_0_rgba(16,24,40,0.02)] backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <HexMark className="size-5" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight">
            Dashflow<span className="text-primary"> POS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground md:flex">
          <a href="#pricing" className="rounded-lg px-3.5 py-2 transition-colors hover:bg-secondary hover:text-foreground">Pricing</a>
          <a href="#product" className="rounded-lg px-3.5 py-2 transition-colors hover:bg-secondary hover:text-foreground">Product</a>
          <a href="#faq" className="rounded-lg px-3.5 py-2 transition-colors hover:bg-secondary hover:text-foreground">FAQ</a>
          <Link href="/track-order" className="rounded-lg px-3.5 py-2 transition-colors hover:bg-secondary hover:text-foreground">Track an order</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground lg:inline">
                Signed in as <span className="font-medium text-foreground">{user.name}</span>
              </span>
              <Link
                href="/dashboard"
                className="hidden items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:inline-flex"
              >
                Go to dashboard
                <ArrowRight className="size-3.5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary md:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="hidden items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:inline-flex"
              >
                Sign up free
                <ArrowRight className="size-3.5" />
              </Link>
            </>
          )}
          <MobileNav userName={user?.name ?? null} />
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

function Hero({ user }: { user: Awaited<ReturnType<typeof getCurrentUser>> }) {
  return (
    <section className="relative overflow-hidden bg-[oklch(0.17_0.02_255)] text-[oklch(0.96_0.005_255)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] size-[560px] rounded-full opacity-30 blur-[110px]"
        style={{ background: "oklch(0.62 0.14 168)" }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-16 px-4 pb-24 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-32 lg:pt-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Built for multi-branch retail in East &amp; West Africa
          </span>

          <h1 className="mt-6 font-[family-name:var(--font-display)] text-[2.5rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Run every branch<br />from one dashboard.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
            Dashflow POS puts your till, stock, staff and takings for every branch in one place
            — updated the moment a sale happens, in KES, UGX, TZS or whichever currency your
            business runs on.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href={user ? "/dashboard" : "/subscribe"}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
            >
              {user ? "Go to your dashboard" : "Choose your plan"}
              <ArrowRight className="size-4" />
            </Link>
            {user ? (
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/5"
              >
                Add more modules
              </Link>
            ) : (
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/5"
              >
                See pricing
              </a>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/45">
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-primary" /> Pay only for the modules you use</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-primary" /> Bluetooth, USB &amp; network receipt printers</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-primary" /> Works on any phone or laptop</span>
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-primary" /> No setup fees</span>
          </div>
        </div>

        <HeroMockups />
      </div>
    </section>
  );
}

/**
 * The signature moment of the page: real screenshots of the actual product —
 * the web dashboard and the installed phone app — not illustrated
 * recreations, so a visiting owner sees exactly what they'd be running
 * before they ever sign up.
 */
function HeroMockups() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-lg sm:h-[560px] lg:h-[600px]">
      <div className="absolute left-0 top-4 w-[82%] -rotate-6 overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.22_0.022_255)] shadow-2xl shadow-black/40">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-white/15" />
          <span className="ml-2 text-[10px] font-medium text-primary">dashflow.app/dashboard</span>
        </div>
        <img
          src="/screenshots/dashboard-overview.png"
          alt="The Dashflow POS dashboard on the web, showing today's revenue, receipts and recent sales across every branch"
          loading="lazy"
          className="block w-full"
        />
      </div>

      <div className="absolute bottom-0 right-0 w-[52%] rotate-[6deg] overflow-hidden rounded-[1.8rem] border-[8px] border-neutral-900 bg-neutral-900 shadow-2xl shadow-black/50">
        <img
          src="/screenshots/pwa-overview.png"
          alt="The Dashflow POS mobile app's Overview screen, installed on a phone, in its dark theme"
          loading="lazy"
          className="block w-full"
        />
      </div>
    </div>
  );
}

/* ------------------------------- City marquee ------------------------------ */

function CityMarquee() {
  const loop = [...CITIES, ...CITIES];
  return (
    <div className="overflow-hidden border-b border-border bg-secondary/40 py-3">
      <div className="marquee flex w-max items-center gap-10 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
        {loop.map((city, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="size-1 rounded-full bg-primary/60" />
            {city}
          </span>
        ))}
      </div>
      <style>{`
        .marquee { animation: dashflow-marquee 32s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .marquee { animation: none; } }
        @keyframes dashflow-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------- Photo strip -------------------------------- */

const REAL_PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1687422808311-a776f467a468?auto=format&fit=crop&w=900&q=80",
    alt: "A shop owner at her counter",
    caption: "Independent shops",
  },
  {
    src: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=80",
    alt: "Stocked supermarket aisle",
    caption: "Supermarkets & wholesalers",
  },
  {
    src: "https://images.unsplash.com/photo-1759334928681-dc7ad674138e?auto=format&fit=crop&w=900&q=80",
    alt: "A shopkeeper among his stock",
    caption: "Growing retail chains",
  },
];

function PhotoStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {REAL_PHOTOS.map((p) => (
          <figure key={p.src} className="group relative overflow-hidden rounded-2xl">
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-64"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
            <figcaption className="absolute bottom-3 left-4 text-sm font-semibold text-white">
              {p.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Packages ------------------------------- */

function PackagesGrid() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Pricing</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick the plan that fits your business.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          A small shop and a growing wholesaler shouldn&apos;t pay the same way. Every plan gets
          the real, full version of each module it includes — plans differ in how many staff
          logins and branches you get, not in what the software can do. Pay monthly, or annually
          for two months free.
        </p>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-5">
        {PLAN_LIST.map((p) => (
          <div
            key={p.key}
            className={`relative flex flex-col rounded-2xl border p-6 shadow-card ${
              p.popular ? "border-primary bg-card ring-1 ring-primary/30" : "border-border bg-card"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
                Most popular
              </span>
            )}
            <h3 className="text-base font-semibold tracking-tight">{p.label}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.tagline}</p>

            <div className="mt-5">
              {p.monthlyPrice !== null ? (
                <>
                  <span className="num font-[family-name:var(--font-display)] text-2xl font-semibold">
                    {formatMoney(p.monthlyPrice, "UGX")}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </>
              ) : (
                <>
                  <span className="num font-[family-name:var(--font-display)] text-xl font-semibold">
                    From {formatMoney(p.startingPrice ?? 0, "UGX")}
                  </span>
                  <span className="block text-xs text-muted-foreground">/mo · custom pricing</span>
                </>
              )}
            </div>

            <ul className="mt-5 flex-1 space-y-2.5 text-xs text-muted-foreground">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {h}
                </li>
              ))}
            </ul>

            <Link
              href={`/subscribe?plan=${p.key}`}
              className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                p.popular
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border text-foreground hover:bg-secondary"
              }`}
            >
              {p.monthlyPrice !== null ? "Get started" : "Contact us"}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have accounting software and only need POS and inventory? Skip the packages —{" "}
        <a href="#modules" className="font-medium text-primary hover:underline">
          build your own from individual modules
        </a>
        .
      </p>
    </section>
  );
}

/* -------------------------------- Modules grid ------------------------------- */

function ModulesGrid() {
  return (
    <section id="modules" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Or build your own</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          Only need a couple of modules? Pick exactly those.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Already run accounting elsewhere and just need a till and stock control? Skip the
          packages above and pick only the individual modules you actually need — even just one.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
        {MODULE_LIST.map((m) => (
          <Link
            key={m.key}
            href={`/subscribe?modules=${m.key}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-card transition-transform hover:-translate-y-1 hover:shadow-lift"
          >
            <span className={`grid size-14 place-items-center rounded-2xl ${MODULE_TILE_STYLE[m.key]}`}>
              <m.icon className="size-6" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{m.label}</span>
            <span className="text-xs leading-snug text-muted-foreground">{m.description}</span>
            <span className="mt-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Add just this module →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Build your own plan
          <ArrowRight className="size-3.5" />
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          Pick the modules you need and see the total before you sign up.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------- Old vs new -------------------------------- */

function OldVsNew() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-secondary/40 p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">The old way</p>
          <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
            <li>Branch managers send end-of-day totals over WhatsApp — if they remember to.</li>
            <li>Stock counts live in a notebook, so you find out it&apos;s out only when a customer does.</li>
            <li>Payroll and expenses sit in a spreadsheet nobody else can see.</li>
            <li>You visit each branch to actually know how it&apos;s doing.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-accent/40 p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">With Dashflow</p>
          <ul className="mt-5 space-y-4 text-sm text-foreground/80">
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /> Every sale lands on your dashboard the second it happens.</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /> Low stock raises an alert before shelves go empty.</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /> Payroll, expenses and accounts, visible to exactly who should see them.</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /> Check every branch from your phone, wherever you are.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Showcases -------------------------------- */

function Showcases() {
  return (
    <section id="product" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">What you get</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          One system, every part of the business.
        </h2>
      </div>

      <div className="mt-16 space-y-24">
        <ShowcaseRow
          icon={LineChart}
          eyebrow="Overview"
          title="Every branch, one dashboard"
          body="Revenue, receipts, stock value and staff — pulled live from every branch you run, on a single screen. Drill into any branch without leaving your desk."
          mock={
            <RealScreenshot
              src="/screenshots/dashboard-overview.png"
              alt="The Dashflow POS dashboard showing today's revenue, receipts, stock value and recent sales"
              title="dashflow.app/dashboard"
            />
          }
        />
        <ShowcaseRow
          icon={ScanBarcode}
          eyebrow="Terminal"
          title="A till that just works"
          body="Fast product search, barcode scanning, and receipts your customers can trust — online or off. Built for a busy counter, not a boardroom demo."
          mock={
            <RealScreenshot
              src="/screenshots/terminal.png"
              alt="The Dashflow POS sales terminal showing a product grid, category filters and the current sale panel"
              title="dashflow.app/pos"
            />
          }
          reverse
        />
        <ShowcaseRow
          icon={Boxes}
          eyebrow="Inventory"
          title="Stock that never surprises you"
          body="Know exactly what's on the shelf at every branch, and get warned before something runs out — not after a customer walks away empty-handed."
          mock={
            <RealScreenshot
              src="/screenshots/inventory.png"
              alt="The Dashflow POS inventory dashboard showing stock levels, top movers and stock by branch"
              title="dashflow.app/inventory"
            />
          }
        />
        <ShowcaseRow
          icon={Fingerprint}
          eyebrow="Attendance"
          title="Know who's actually on shift"
          body="Staff clock in with a fingerprint, a shared device, or a PIN — no hardware required. See who's on time, who's late and who hasn't shown up yet, live."
          mock={
            <RealScreenshot
              src="/screenshots/attendance.png"
              alt="The Dashflow POS attendance screen showing who's clocked in, on-time and late staff, and the team check-in panel"
              title="dashflow.app/attendance"
            />
          }
          reverse
        />
        <ShowcaseRow
          icon={HandCoins}
          eyebrow="Debtors"
          title="Track exactly who owes what"
          body="Record credit sales, take repayments as they come in, and see every outstanding balance by debtor and by branch — no more relying on a notebook under the counter."
          mock={
            <RealScreenshot
              src="/screenshots/debtor-payments.png"
              alt="The Dashflow POS debtor payments screen showing active debtors, total outstanding balance and a list of debtors with their balances"
              title="dashflow.app/debtor-payment"
            />
          }
        />
        <ShowcaseRow
          icon={LineChart}
          eyebrow="Reports"
          title="See exactly how the business is doing"
          body="Revenue, profit, category and branch breakdowns, top products and a full profit &amp; loss summary — all real, all visual, updated the moment a sale happens. No spreadsheets to build yourself."
          mock={
            <RealScreenshot
              src="/screenshots/reports.png"
              alt="The Dashflow POS reports dashboard showing revenue trend, sales by category, revenue by branch and a profit and loss summary"
              title="dashflow.app/reports"
            />
          }
          reverse
        />
        <ShowcaseRow
          icon={Wallet}
          eyebrow="Till management"
          title="Know exactly what's in every till"
          body="See each till's live cash balance, who it's assigned to, and every safe removal — so a manager always knows how much a cashier is holding and what they've sold, without walking to the counter."
          mock={
            <RealScreenshot
              src="/screenshots/till-management.png"
              alt="The Dashflow POS till management screen showing active tills, total balance held, and a safe-removal form with removal history"
              title="dashflow.app/till-management"
            />
          }
        />
        <ShowcaseRow
          icon={Smartphone}
          eyebrow="Mobile app"
          title="Run the business from your pocket"
          body="Install Dashflow straight to an Android home screen — no app store, no laptop required. The full dashboard, sales, inventory and reports, sized and styled for a phone, with its own light or dark look."
          mock={<MobileAppMock />}
          reverse
        />
      </div>
    </section>
  );
}

function ShowcaseRow({
  icon: Icon,
  eyebrow,
  title,
  body,
  mock,
  reverse = false,
}: {
  icon: typeof LineChart;
  eyebrow: string;
  title: string;
  body: string;
  mock: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <div>
        <span className="inline-grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <div className="rounded-2xl border border-border bg-secondary/30 p-4 sm:p-6">{mock}</div>
    </div>
  );
}

/** A phone device bezel around a real mobile-app screenshot — the phone-shaped counterpart to RealScreenshot's browser chrome, for the PWA showcase below. */
function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-[2.4rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl">
      <img src={src} alt={alt} loading="lazy" className="block w-full" />
    </div>
  );
}

/** Two real screenshots of the installed mobile app (public/screenshots/pwa-*.png) — its own dark theme, its own navigation, on an actual phone-shaped frame rather than a browser window. */
function MobileAppMock() {
  return (
    <div className="mx-auto flex max-w-sm items-end justify-center">
      <div className="w-[44%] translate-y-6 opacity-90">
        <PhoneFrame
          src="/screenshots/pwa-sidebar.png"
          alt="The Dashflow POS mobile app's navigation menu, grouped into Inventory, Sales & Till and Business"
        />
      </div>
      <div className="-ml-8 w-[56%]">
        <PhoneFrame
          src="/screenshots/pwa-overview.png"
          alt="The Dashflow POS mobile app's Overview screen, showing today's revenue, receipts, stock value and customers in its dark theme"
        />
      </div>
    </div>
  );
}

/** An actual screenshot of the running app (see public/screenshots), not an illustrated recreation — real data, real layout, exactly what a visitor would see after signing up. */
function RealScreenshot({ src, alt, title }: { src: string; alt: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-1.5 border-b border-border bg-secondary/60 px-3 py-2">
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <span className="ml-2 text-[10px] font-medium text-muted-foreground">{title}</span>
      </div>
      <img src={src} alt={alt} loading="lazy" className="block w-full" />
    </div>
  );
}

/* ------------------------------ Hardware showcase ---------------------------- */

const HARDWARE = [
  { icon: ScanBarcode, label: "Barcode scanners", body: "USB and Bluetooth scanners — scan straight into the terminal's search box." },
  { icon: Printer, label: "Bluetooth receipt printers", body: "Pair a thermal printer once from Settings; every receipt after that prints straight to it, no cables." },
  { icon: Printer, label: "USB & network printers", body: "The same receipt goes to a USB or Wi-Fi/Ethernet printer just as easily — pick whatever the branch already has." },
  { icon: Package, label: "Cash drawers", body: "Wired to the receipt printer, the drawer kicks open automatically when a cash sale completes." },
];

function HardwareShowcase() {
  return (
    <section className="border-y border-border bg-secondary/30 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Hardware</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
            Real counter hardware, not just a screen.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            The Terminal doesn&apos;t care which printer is plugged in. Pair a Bluetooth thermal
            printer once and every sale from then on prints on its own — the same receipt would
            print just as well over USB or a network printer instead.
          </p>

          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            {HARDWARE.map((h) => (
              <div key={h.label} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <h.icon className="size-4" />
                </span>
                <div>
                  <dt className="text-sm font-semibold">{h.label}</dt>
                  <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{h.body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <img
            src="https://images.unsplash.com/photo-1647427017067-8f33ccbae493?auto=format&fit=crop&w=700&q=80"
            alt="Cashier operating a point-of-sale machine"
            loading="lazy"
            className="col-span-2 h-56 w-full rounded-2xl object-cover shadow-card sm:h-72"
          />
          <img
            src="https://images.unsplash.com/photo-1748362280546-c7306987088c?auto=format&fit=crop&w=700&q=80"
            alt="Contactless card payment at checkout"
            loading="lazy"
            className="col-span-2 h-40 w-full rounded-2xl object-cover shadow-card sm:h-48"
          />
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------- FAQ ------------------------------------ */

const FAQS = [
  {
    q: "Which countries and currencies do you support?",
    a: "Dashflow is built for retail businesses across Kenya, Uganda, Tanzania, Rwanda, Nigeria and Ghana today, with KES, UGX, TZS, RWF, NGN and GHS built in. Set your currency once in Settings and every screen, receipt and report follows.",
  },
  {
    q: "Can I use it with more than one branch?",
    a: "Yes \u2014 that's the core of Dashflow. Add as many branches as your plan allows, assign a manager and staff to each, and see every branch on one dashboard while managers and staff only see their own.",
  },
  {
    q: "Does it work without internet?",
    a: "The till keeps working through short outages and syncs once you're back online, so a bad connection at the counter won't stop a sale.",
  },
  {
    q: "Who can see what?",
    a: "You decide. Owners and admins see everything, managers see their branch's sales, stock and staff, and till staff see the terminal, sales and customers \u2014 nothing more.",
  },
  {
    q: "What do I need to run it?",
    a: "Any phone, tablet or laptop with a browser. There's no special hardware to buy to get started \u2014 a barcode scanner and receipt printer are optional extras.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes, upgrade or downgrade whenever your business changes. Moving between plans doesn't touch your sales history or settings.",
  },
];

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">FAQ</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
          Questions, answered.
        </h2>
      </div>

      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQS.map((f) => (
          <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
              <span className="flex items-center gap-2.5">
                <MessageCircleQuestion className="size-4 shrink-0 text-primary" />
                {f.q}
              </span>
              <span className="shrink-0 text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 pl-6 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Final CTA ---------------------------------- */

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[oklch(0.17_0.02_255)] py-24 text-center text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-25 blur-[110px]"
        style={{ background: "oklch(0.62 0.14 168)" }}
      />
      <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
        <ShieldCheck className="mx-auto size-9 text-primary" />
        <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          See your business, whole, from day one.
        </h2>
        <p className="mt-4 text-white/60">
          Set up your first branch in minutes. No card required to start.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
        >
          Sign up free
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

/* --------------------------------- Footer ------------------------------------ */

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <HexMark className="size-5" />
              </span>
              <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight">
                Dashflow<span className="text-primary"> POS</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Point of sale, inventory and multi-branch management built for retail businesses
              across East &amp; West Africa.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Smartphone className="size-3.5" /> Works on any phone or laptop
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Product</p>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
              <a href="#product" className="hover:text-foreground">Product</a>
              <a href="#pricing" className="hover:text-foreground">Pricing</a>
              <a href="#faq" className="hover:text-foreground">FAQ</a>
              <Link href="/track-order" className="hover:text-foreground">Track an order</Link>
              <Link href="/login" className="hover:text-foreground">Log in</Link>
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Contact</p>
            <div className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
              <a href="tel:+256781710027" className="flex items-center gap-2 hover:text-foreground">
                <Phone className="size-3.5" /> 0781 710 027
              </a>
              <a href="tel:+256761905113" className="flex items-center gap-2 hover:text-foreground">
                <Phone className="size-3.5" /> 0761 905 113
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Dashflow POS. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">
            Built and maintained by <span className="font-medium text-foreground">Skyrix Technologies</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
