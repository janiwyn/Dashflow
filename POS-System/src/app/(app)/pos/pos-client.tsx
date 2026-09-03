"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  Search,
  Trash2,
  CreditCard,
  Smartphone,
  Banknote,
  PauseCircle,
  History,
  X,
  AlertTriangle,
  Camera,
  CameraOff,
  ScanBarcode,
  Keyboard,
} from "lucide-react";
import Link from "next/link";

import { checkoutSale, type CartLine } from "@/app/actions/sales";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/currency-provider";
import type { assertClockedIn } from "@/db/queries/attendance";
import type { viewCategories, viewCustomers, viewPosProducts } from "@/db/queries/views";

type Props = {
  categories: Awaited<ReturnType<typeof viewCategories>>;
  products: Awaited<ReturnType<typeof viewPosProducts>>;
  clockGate: Awaited<ReturnType<typeof assertClockedIn>>;
  customers: Awaited<ReturnType<typeof viewCustomers>>;
};

const WALK_IN = "walkin";

type PaymentMethod = "cash" | "mpesa" | "card";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "mpesa", label: "Mobile Money", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
];

type HeldSale = { id: string; cart: Record<string, number>; heldAt: number };

function isBarcodeDetectorSupported() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

/** Formats a real barcode scanner is likely to send, plus QR as a fallback for in-store printed codes. */
const BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"];

export default function Terminal({ categories, products, clockGate, customers }: Props) {
  const router = useRouter();
  const { format: currency } = useCurrency();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [customerId, setCustomerId] = useState<string>(WALK_IN);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [heldOpen, setHeldOpen] = useState(false);
  const [charging, startCharging] = useTransition();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraSupported] = useState(isBarcodeDetectorSupported);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (q === "" || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)),
    );
  }, [products, category, query]);

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: byId.get(id), qty }))
    .filter((l): l is { product: NonNullable<typeof l.product>; qty: number } => Boolean(l.product));

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const tax = Math.round(subtotal * 0.16);

  const bump = (id: string, delta: number) =>
    setCart((c) => {
      const stock = byId.get(id)?.stock ?? 0;
      const next = Math.min(stock, (c[id] ?? 0) + delta);
      const { [id]: _removed, ...rest } = c;
      return next <= 0 ? rest : { ...c, [id]: next };
    });

  const addToCart = (id: string) => {
    const stock = byId.get(id)?.stock ?? 0;
    if (stock <= 0) {
      toast.error("Out of stock.");
      return;
    }
    bump(id, 1);
  };

  /** A scanned/typed code exact-matches a product's SKU — the same code printed on that product's shelf/barcode label. Shown with its price the way a real checkout scanner beeps and displays it. */
  const scanLookup = (code: string): boolean => {
    const value = code.trim();
    if (!value) return false;
    const product = byId.get(value) ?? products.find((p) => p.id.toLowerCase() === value.toLowerCase());
    if (!product) {
      toast.error(`No product matches code "${value}".`);
      return false;
    }
    addToCart(product.id);
    toast.success(`${product.name} — ${currency(product.price)}`);
    return true;
  };

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    // A real scanner fills this field and fires Enter instantly. If the code
    // exactly matches a product, treat it as a scan and clear the field for
    // the next item. If it doesn't match anything, the cashier was just
    // searching/typing — leave the live filter results as they are.
    const product = byId.get(value) ?? products.find((p) => p.id.toLowerCase() === value.toLowerCase());
    if (product) {
      addToCart(product.id);
      toast.success(`${product.name} — ${currency(product.price)}`);
      setQuery("");
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: BARCODE_FORMATS });

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const value = codes[0].rawValue as string;
            const now = Date.now();
            // A held-up product stays in frame for many video frames — this
            // stops the same code being re-scanned and re-added every ~16ms.
            if (!(lastScanRef.current?.code === value && now - lastScanRef.current.at < 1500)) {
              lastScanRef.current = { code: value, at: now };
              scanLookup(value);
            }
          }
        } catch {
          // A single failed frame isn't worth surfacing — keep scanning.
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError("Couldn't access the camera. Check the browser's camera permission and try again.");
      setCameraOn(false);
    }
  };

  useEffect(() => stopCamera, []);

  const onManualScanSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (scanLookup(manualCode)) setManualCode("");
  };

  const closeScanner = () => {
    stopCamera();
    setScannerOpen(false);
  };

  const holdSale = () => {
    if (lines.length === 0) {
      toast.info("Nothing in the cart to hold.");
      return;
    }
    setHeldSales((h) => [{ id: crypto.randomUUID(), cart, heldAt: Date.now() }, ...h]);
    setCart({});
    toast.success("Sale held. Resume it any time before closing out.");
  };

  const resumeSale = (id: string) => {
    const held = heldSales.find((h) => h.id === id);
    if (!held) return;
    setHeldSales((h) => {
      const rest = h.filter((x) => x.id !== id);
      // Don't lose whatever's currently in the cart — hold it too.
      if (lines.length > 0) {
        return [{ id: crypto.randomUUID(), cart, heldAt: Date.now() }, ...rest];
      }
      return rest;
    });
    setCart(held.cart);
    setHeldOpen(false);
  };

  const discardHeld = (id: string) => setHeldSales((h) => h.filter((x) => x.id !== id));

  const charge = () => {
    if (!clockGate.ok) {
      toast.error(clockGate.message);
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one item before charging.");
      return;
    }
    const items: CartLine[] = lines.map((l) => ({ sku: l.product.id, qty: l.qty }));
    startCharging(async () => {
      const result = await checkoutSale({
        items,
        method,
        customerId: customerId !== WALK_IN ? Number(customerId) : undefined,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setCart({});
      setCustomerId(WALK_IN);
      router.push("/receipt-preview");
      router.refresh();
    });
  };

  return (
    <AppShell title="Sales terminal" subtitle="Till 02 · Cashier James K.">
      {!clockGate.ok && (
        <div className="flex items-center gap-3 rounded-xl border border-l-4 border-warning bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="size-4 shrink-0 text-warning-foreground" />
          <p className="min-w-0 flex-1">{clockGate.message}</p>
          <Button asChild size="sm" variant="outline" className="shrink-0 rounded-lg">
            <Link href="/attendance">Go to Attendance</Link>
          </Button>
        </div>
      )}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <form onSubmit={onSearchSubmit} method="post" className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scan barcode or search product"
                className="h-11 rounded-xl bg-card pl-9"
              />
            </form>
            <Button
              variant="outline"
              className="h-11 shrink-0 rounded-xl"
              onClick={() => setScannerOpen(true)}
            >
              <ScanBarcode className="size-4" /> Scan
            </Button>
            <Button
              variant="outline"
              className="h-11 shrink-0 rounded-xl"
              onClick={holdSale}
              disabled={lines.length === 0}
            >
              <PauseCircle className="size-4" /> Hold sale
            </Button>
            <Button
              variant="outline"
              className="relative h-11 shrink-0 rounded-xl"
              onClick={() => setHeldOpen(true)}
              disabled={heldSales.length === 0}
            >
              <History className="size-4" /> Held
              {heldSales.length > 0 && (
                <span className="num absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {heldSales.length}
                </span>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  category === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                No products match &ldquo;{query}&rdquo;.
              </p>
            )}
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p.id)}
                disabled={p.stock <= 0}
                className="panel group min-w-0 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold">{p.name}</p>
                  <span
                    className={cn(
                      "num shrink-0 rounded-md px-1.5 py-0.5 text-[0.7rem] font-medium",
                      p.stock <= 12 ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {p.stock}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{p.category}</p>
                <p className="num mt-4 text-lg font-semibold text-foreground">{currency(p.price)}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="panel flex min-w-0 flex-col self-start p-5 xl:sticky xl:top-24">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-base font-semibold">Current sale</h2>
            <span className="num shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {lines.length} items
            </span>
          </div>

          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="mt-3 h-10 rounded-lg text-sm">
              <SelectValue placeholder="Walk-in (no account)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WALK_IN}>Walk-in (no account)</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ul className="mt-4 min-h-[120px] divide-y divide-border">
            {lines.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">
                Tap a product to start a sale
              </li>
            )}
            {lines.map(({ product, qty }) => (
              <li key={product.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="num truncate text-xs text-muted-foreground">
                    {qty} × {currency(product.price)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-7 rounded-md" onClick={() => bump(product.id, -1)}>
                    {qty === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                  </Button>
                  <span className="num w-6 text-center text-sm">{qty}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-md"
                    onClick={() => bump(product.id, 1)}
                    disabled={qty >= product.stock}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={currency(subtotal)} />
            <Row label="VAT (16%)" value={currency(tax)} />
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-3">
              <dt className="truncate font-display text-base font-semibold">Total</dt>
              <dd className="num text-xl font-bold">{currency(subtotal + tax)}</dd>
            </div>
          </dl>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMethod(value)}
                aria-pressed={method === value}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors",
                  method === value
                    ? "border-primary bg-accent text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <Button
            className="mt-3 h-12 w-full rounded-xl text-base"
            onClick={charge}
            disabled={charging || lines.length === 0 || !clockGate.ok}
          >
            {charging ? "Charging…" : !clockGate.ok ? "Clock in to charge" : `Charge ${currency(subtotal + tax)}`}
          </Button>
        </aside>
      </div>

      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Held sales</DialogTitle>
          </DialogHeader>
          {heldSales.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No sales on hold.</p>
          ) : (
            <ul className="divide-y divide-border">
              {heldSales.map((h) => {
                const items = Object.entries(h.cart);
                const count = items.reduce((s, [, qty]) => s + qty, 0);
                const total = items.reduce((s, [id, qty]) => s + (byId.get(id)?.price ?? 0) * qty, 0);
                return (
                  <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {count} item{count === 1 ? "" : "s"} · {currency(total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Held {new Date(h.heldAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" className="rounded-lg" onClick={() => resumeSale(h.id)}>
                        Resume
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-muted-foreground"
                        onClick={() => discardHeld(h.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={scannerOpen} onOpenChange={(open) => (open ? setScannerOpen(true) : closeScanner())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan barcode</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {cameraOn ? (
              <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border-2 border-primary/50 bg-black">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
                <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/70" />
              </div>
            ) : (
              <div className="flex size-40 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
                <ScanBarcode className="size-16 text-muted-foreground" />
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {cameraOn
                ? "Hold a product's barcode up to the camera — items add to the cart automatically"
                : "Scan with a camera, or use a handheld scanner (it types into the field below)"}
            </p>

            {cameraSupported ? (
              <Button onClick={cameraOn ? stopCamera : startCamera} variant={cameraOn ? "outline" : "default"} className="rounded-lg">
                {cameraOn ? <CameraOff className="mr-2 size-4" /> : <Camera className="mr-2 size-4" />}
                {cameraOn ? "Stop camera" : "Scan with camera"}
              </Button>
            ) : (
              <p className="max-w-xs text-center text-xs text-muted-foreground">
                Camera scanning isn&apos;t supported in this browser — try Chrome or Edge, or use a handheld
                barcode scanner (it types into the field below like a keyboard).
              </p>
            )}
            {cameraError && <p className="text-xs text-destructive">{cameraError}</p>}

            <form onSubmit={onManualScanSubmit} method="post" className="flex w-full max-w-xs items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Keyboard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Or type/scan SKU"
                  className="h-10 rounded-lg pl-9"
                  autoFocus
                />
              </div>
              <Button type="submit" variant="outline" className="h-10 shrink-0 rounded-lg">
                Add
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <dt className="truncate text-muted-foreground">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}
