"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QrCode, ScanLine, CheckCircle2, RefreshCcw, Camera, CameraOff, Keyboard } from "lucide-react";

import { completeRemoteOrder } from "@/app/actions/orders";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/components/currency-provider";
import type { viewRemoteOrders } from "@/db/queries/views";

type Order = Awaited<ReturnType<typeof viewRemoteOrders>>[number];
type Method = "cash" | "mpesa" | "card" | "bank";

const METHODS: { value: Method; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "mpesa", label: "Mobile Money" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank" },
];

function isBarcodeDetectorSupported() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

type Props = {
  remoteOrders: Order[];
};

export default function QrScannerPage({ remoteOrders }: Props) {
  const router = useRouter();
  const { format: currency } = useCurrency();
  const [scanned, setScanned] = useState<Order | null>(null);
  const [notFoundRef, setNotFoundRef] = useState<string | null>(null);
  const [manualRef, setManualRef] = useState("");
  const [method, setMethod] = useState<Method>("cash");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [completing, startCompleting] = useTransition();

  const [cameraSupported] = useState(isBarcodeDetectorSupported);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const lookUp = (reference: string) => {
    const ref = reference.trim();
    if (!ref) return;
    const order = remoteOrders.find((o) => o.ref.toLowerCase() === ref.toLowerCase());
    if (!order) {
      setNotFoundRef(ref);
      setScanned(null);
      return;
    }
    setNotFoundRef(null);
    setScanned(order);
    setReceipt(null);
    setManualRef("");
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
      const detector = new Detector({ formats: ["qr_code"] });

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const value = codes[0].rawValue as string;
            stopCamera();
            lookUp(value);
            return;
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

  const reset = () => {
    setScanned(null);
    setReceipt(null);
    setNotFoundRef(null);
  };

  const onManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    lookUp(manualRef);
  };

  const completeOrder = () => {
    if (!scanned) return;
    startCompleting(async () => {
      const result = await completeRemoteOrder({ reference: scanned.ref, method });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setReceipt(result.receiptReference ?? null);
      router.refresh();
    });
  };

  return (
    <AppShell title="QR Code Scanner" subtitle="Complete remote orders at pickup">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel flex min-h-[420px] flex-col items-center justify-center gap-4 p-6">
          {cameraOn ? (
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-primary/50 bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
              <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-white/70" />
            </div>
          ) : (
            <div className="flex size-56 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
              <QrCode className="size-24 text-muted-foreground" />
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {cameraOn ? "Point the camera at the customer's order QR code" : "Scan with a camera, or enter the order reference below"}
          </p>

          {cameraSupported ? (
            <Button onClick={cameraOn ? stopCamera : startCamera} variant={cameraOn ? "outline" : "default"} className="rounded-lg">
              {cameraOn ? <CameraOff className="mr-2 size-4" /> : <Camera className="mr-2 size-4" />}
              {cameraOn ? "Stop camera" : "Scan with camera"}
            </Button>
          ) : (
            <p className="max-w-xs text-center text-xs text-muted-foreground">
              Camera scanning isn&apos;t supported in this browser — try Chrome or Edge, or use a handheld QR
              scanner (it types into the field below like a keyboard).
            </p>
          )}
          {cameraError && <p className="text-xs text-destructive">{cameraError}</p>}

          <form onSubmit={onManualSubmit} className="flex w-full max-w-sm items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Keyboard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                placeholder="Or type/scan order reference"
                className="h-10 rounded-lg pl-9"
                autoFocus
              />
            </div>
            <Button type="submit" variant="outline" className="h-10 shrink-0 rounded-lg">
              <ScanLine className="size-4" /> Look up
            </Button>
          </form>
          {notFoundRef && (
            <p className="text-xs text-destructive">No order found matching &ldquo;{notFoundRef}&rdquo;.</p>
          )}
        </div>

        <div className="panel min-h-[420px] p-6">
          {!scanned ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Scan a QR code to view order details
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-base font-semibold">Order details</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Order Reference" value={scanned.ref} />
                <Field label="Branch" value={scanned.branch} />
                <Field label="Customer Name" value={scanned.customer} />
                <Field label="Customer Phone" value={scanned.phone} />
                <Field label="Expected Amount" value={currency(scanned.amount)} />
                <Field label="Order Date" value={scanned.date} />
              </dl>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Order items</h3>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr><th className="py-1 text-left">Product</th><th className="text-left">Qty</th><th className="text-right">Unit</th><th className="text-right">Subtotal</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {scanned.items.map((it) => (
                      <tr key={it.name}>
                        <td className="py-2">{it.name}</td>
                        <td className="num">{it.qty}</td>
                        <td className="num text-right">{currency(it.price)}</td>
                        <td className="num text-right font-medium">{currency(it.price * it.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {receipt ? (
                <div className="rounded-lg bg-success/10 p-4 text-sm text-success">
                  <CheckCircle2 className="mb-1 size-5" />
                  Sale recorded successfully. Receipt no. <span className="num font-semibold">{receipt}</span>
                </div>
              ) : scanned.status !== "Pending" ? (
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  This order is already {scanned.status.toLowerCase()} — nothing to complete.
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                    <SelectTrigger className="h-9 w-[160px] rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={completeOrder} disabled={completing} className="rounded-lg">
                    <CheckCircle2 className="mr-2 size-4" /> {completing ? "Completing…" : "Complete order"}
                  </Button>
                </div>
              )}
              <Button variant="outline" onClick={reset} className="rounded-lg">
                <RefreshCcw className="mr-2 size-4" /> Scan another code
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
