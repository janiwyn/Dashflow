import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Boxes,
  Users,
  Banknote,
  ScanBarcode,
  LineChart,
  Wifi,
  Smartphone,
  MessageCircleQuestion,
  Calculator,
  Bell,
  Plus,
  BookOpen,
  Scale,
  Landmark,
  FileText,
  Wallet,
  CalendarClock,
  AlertTriangle,
  UserX,
  Printer,
  Package,
} from "lucide-react";

import { formatMoney } from "@/lib/currency";
import { MODULE_LIST, MODULE_TILE_STYLE } from "@/lib/modules";
import { getCurrentUser } from "@/lib/session";

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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ScanBarcode className="size-4" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight">
            Dashflow<span className="text-primary"> POS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#modules" className="transition-colors hover:text-foreground">Modules &amp; pricing</a>
          <a href="#product" className="transition-colors hover:text-foreground">Product</a>
          <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          <Link href="/track-order" className="transition-colors hover:text-foreground">Track an order</Link>
        </nav>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Signed in as <span className="font-medium text-foreground">{user.name}</span>
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Go to dashboard
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Sign up free
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
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
              {user ? "Go to your dashboard" : "Choose your modules"}
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
                href="#modules"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/5"
              >
                See modules &amp; pricing
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
 * The signature moment of the page: a small fan of faithful, miniature
 * recreations of the real product's own screens — not stock photography —
 * so a visiting owner sees the actual dashboard, till and branch list they'd
 * be running, before they ever sign up.
 */
function HeroMockups() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-md sm:h-[460px]">
      <MockWindow className="absolute left-0 top-6 w-[78%] rotate-[-6deg]" title="Branches">
        <div className="space-y-2">
          {[
            { name: "Nairobi \u2014 Main", sales: "KSh 214,720" },
            { name: "Mombasa \u2014 Nyali", sales: "KSh 96,150" },
            { name: "Kampala \u2014 Oginga", sales: "UGX 710,040" },
          ].map((b) => (
            <div key={b.name} className="flex items-center justify-between rounded-md bg-black/20 px-2.5 py-2">
              <span className="text-[11px] text-white/70">{b.name}</span>
              <span className="num text-[11px] font-medium text-primary-foreground/90">{b.sales}</span>
            </div>
          ))}
        </div>
      </MockWindow>

      <MockWindow className="absolute right-0 top-0 w-[70%] rotate-[4deg]" title="Overview" accent>
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">Revenue today</p>
        <p className="num mt-1 text-2xl font-semibold text-white">UGX 214,720</p>
        <div className="mt-3 flex h-14 items-end gap-1">
          {[40, 55, 35, 70, 50, 90, 65].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-primary/70" style={{ height: `${h}%` }} />
          ))}
        </div>
      </MockWindow>

      <MockWindow className="absolute bottom-0 left-4 w-[72%] rotate-[3deg]" title="Terminal">
        <div className="space-y-1.5">
          {[
            ["Arabica Beans 1kg", "5,550"],
            ["Fresh Milk 500ml", "390"],
            ["Bar Soap 6pk", "900"],
          ].map(([n, p]) => (
            <div key={n} className="flex items-center justify-between text-[11px]">
              <span className="text-white/65">{n}</span>
              <span className="num text-white/90">{p}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between rounded-md bg-primary/20 px-2.5 py-1.5">
            <span className="text-[11px] font-medium text-primary-foreground/90">Total</span>
            <span className="num text-[11px] font-semibold text-primary-foreground">UGX 6,840</span>
          </div>
        </div>
      </MockWindow>
    </div>
  );
}

function MockWindow({
  title,
  children,
  className = "",
  accent = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[oklch(0.22_0.022_255)] shadow-2xl shadow-black/40 ${className}`}
    >
      <div className="flex items-center gap-1.5 rounded-t-xl border-b border-white/10 px-3 py-2">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className={`ml-2 text-[10px] font-medium ${accent ? "text-primary" : "text-white/40"}`}>{title}</span>
      </div>
      <div className="p-3">{children}</div>
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

/* -------------------------------- Modules grid ------------------------------- */

function ModulesGrid() {
  return (
    <section id="modules" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Modules &amp; pricing</p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
          One platform. Pay only for what you turn on.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Start with a Point of Sale and Inventory. Switch on Accounting, Procurement, HR,
          Attendance and Payroll the moment your business is ready for them — every module plugs
          straight into the ones you already run, so nothing gets entered twice. No bundles, no
          tiers — the price you see on a module is the price you pay for it.
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
            <span className="num mt-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground/80">
              {formatMoney(m.monthlyPrice, "KES")}/mo
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Build your plan
          <ArrowRight className="size-3.5" />
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          Click any module above for its price, or pick several and see the total before you sign up.
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
          mock={<OverviewMock />}
        />
        <ShowcaseRow
          icon={ScanBarcode}
          eyebrow="Terminal"
          title="A till that just works"
          body="Fast product search, barcode scanning, and receipts your customers can trust — online or off. Built for a busy counter, not a boardroom demo."
          mock={<PosMock />}
          reverse
        />
        <ShowcaseRow
          icon={Boxes}
          eyebrow="Inventory"
          title="Stock that never surprises you"
          body="Know exactly what's on the shelf at every branch, and get warned before something runs out — not after a customer walks away empty-handed."
          mock={<InventoryMock />}
        />
        <ShowcaseRow
          icon={Users}
          eyebrow="Roles & access"
          title="Everyone sees only what they should"
          body="Owners see it all. Managers see their branch. Staff see the till. Set it once per person and Dashflow keeps everyone in their lane automatically."
          mock={<RolesMock />}
          reverse
        />
        <ShowcaseRow
          icon={Banknote}
          eyebrow="Currency"
          title="Priced and paid in your own currency"
          body="Switch your business to KES, UGX, TZS, RWF, NGN, GHS and more from Settings. Every receipt, report and payslip updates immediately — everywhere."
          mock={<CurrencyMock />}
        />
        <ShowcaseRow
          icon={Calculator}
          eyebrow="Accounting"
          title="A full set of books, built in"
          body="Chart of accounts, ledger, cash book, petty cash, trial balance, income statement and balance sheet — real double-entry accounting that comes with the system, not a spreadsheet bolted on the side or a separate accountant to pay for."
          mock={<AccountingMock />}
          reverse
        />
        <ShowcaseRow
          icon={Bell}
          eyebrow="Alerts"
          title="Nothing slips through — debts, stock or dates"
          body="Dashflow watches for you: customers and shop debtors behind on payment, stock running low, and products approaching their expiry date — all flagged in one place before any of it becomes a loss."
          mock={<AlertsMock />}
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

function BrowserFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-1.5 border-b border-border bg-secondary/60 px-3 py-2">
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <span className="ml-2 text-[10px] font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function OverviewMock() {
  return (
    <BrowserFrame title="dashflow.app/dashboard">
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Revenue today", v: "KSh 214,720" },
          { l: "Receipts", v: "61" },
          { l: "Stock value", v: "KSh 2.4M" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-border p-2.5">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{s.l}</p>
            <p className="num mt-1 text-sm font-semibold">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-20 items-end gap-1.5 rounded-lg border border-border p-2.5">
        {[30, 45, 38, 60, 50, 80, 66, 90].map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-primary/60" style={{ height: `${h}%` }} />
        ))}
      </div>
    </BrowserFrame>
  );
}

function PosMock() {
  return (
    <BrowserFrame title="dashflow.app/pos">
      <div className="grid grid-cols-3 gap-2">
        {["Arabica Beans", "Fresh Milk", "Bar Soap", "Wheat Flour", "Rice 5kg", "Cooking Oil"].map((p) => (
          <div key={p} className="rounded-lg border border-border p-2 text-center text-[10px] font-medium text-muted-foreground">
            {p}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-primary px-3 py-2 text-primary-foreground">
        <span className="text-xs font-medium">Total</span>
        <span className="num text-sm font-semibold">KSh 6,840</span>
      </div>
    </BrowserFrame>
  );
}

function InventoryMock() {
  const rows = [
    { n: "Arabica Beans 1kg", s: 4, low: true },
    { n: "Fresh Milk 500ml", s: 58, low: false },
    { n: "Bar Soap 6pk", s: 9, low: true },
  ];
  return (
    <BrowserFrame title="dashflow.app/inventory">
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.n} className="flex items-center justify-between rounded-lg border border-border px-2.5 py-2 text-[11px]">
            <span className="font-medium">{r.n}</span>
            <span className={`num rounded-full px-2 py-0.5 text-[10px] font-medium ${r.low ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>
              {r.s} left
            </span>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function RolesMock() {
  const roles = [
    { name: "Owner", sees: "Every branch, all finances" },
    { name: "Manager", sees: "Their branch, staff & till" },
    { name: "Staff", sees: "Terminal, sales, customers" },
  ];
  return (
    <BrowserFrame title="dashflow.app/settings">
      <div className="space-y-2">
        {roles.map((r) => (
          <div key={r.name} className="flex items-center gap-3 rounded-lg border border-border px-2.5 py-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-accent text-[10px] font-semibold text-accent-foreground">
              {r.name[0]}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium">{r.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{r.sees}</p>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function CurrencyMock() {
  const currencies = ["KES", "UGX", "TZS", "RWF", "NGN", "GHS"];
  return (
    <BrowserFrame title="dashflow.app/settings">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Display currency</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {currencies.map((c, i) => (
          <span
            key={c}
            className={`num rounded-full px-2.5 py-1 text-[10px] font-medium ${
              i === 1 ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
            }`}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-border px-2.5 py-2">
        <p className="text-[10px] text-muted-foreground">Revenue today</p>
        <p className="num text-sm font-semibold">USh 5,980,000</p>
      </div>
    </BrowserFrame>
  );
}

function AccountingMock() {
  const tiles = [
    { icon: Plus, label: "Add Account" },
    { icon: Banknote, label: "Transactions" },
    { icon: BookOpen, label: "Ledger" },
    { icon: Scale, label: "Trial Balance" },
    { icon: Wallet, label: "Cash Book" },
    { icon: Landmark, label: "Balance Sheet" },
  ];
  return (
    <BrowserFrame title="dashflow.app/accounting">
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-border p-2.5 text-center">
            <t.icon className="mx-auto size-3.5 text-primary" />
            <p className="mt-1.5 text-[9px] font-medium leading-tight">{t.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-[10px] text-muted-foreground">
        <FileText className="size-3.5 text-primary" />
        Income statement &amp; petty cash included
      </div>
    </BrowserFrame>
  );
}

function AlertsMock() {
  const stats = [
    { l: "Overdue debtors", v: "5", icon: UserX },
    { l: "Low stock", v: "3", icon: Boxes },
    { l: "Expiring soon", v: "2", icon: CalendarClock },
  ];
  return (
    <BrowserFrame title="dashflow.app/notifications">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.l} className="rounded-lg border border-border p-2.5">
            <s.icon className="size-3.5 text-warning-foreground" />
            <p className="num mt-1.5 text-sm font-semibold">{s.v}</p>
            <p className="text-[9px] leading-tight text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg bg-warning/10 px-2.5 py-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-3.5 text-warning-foreground" />
          <span className="text-[10px] font-medium">John Kamau · Westlands</span>
        </div>
        <span className="num text-[10px] font-semibold text-warning-foreground">9 days overdue</span>
      </div>
    </BrowserFrame>
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
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <ScanBarcode className="size-3.5" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold">Dashflow POS</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#product" className="hover:text-foreground">Product</a>
          <a href="#modules" className="hover:text-foreground">Modules &amp; pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
          <Link href="/login" className="hover:text-foreground">Log in</Link>
          <span className="flex items-center gap-1.5"><Wifi className="size-3.5" /> Works online &amp; off</span>
          <span className="flex items-center gap-1.5"><Smartphone className="size-3.5" /> Any device</span>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Dashflow POS</p>
      </div>
    </footer>
  );
}
