"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { buildReceipt, type ReceiptData } from "@/lib/printing/escpos";
import { BluetoothPrinter, isBluetoothPrintingSupported } from "@/lib/printing/bluetooth-printer";

type PrinterStatus = "disconnected" | "connecting" | "connected";

type PrinterContextValue = {
  supported: boolean;
  status: PrinterStatus;
  deviceName: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  printReceipt: (data: ReceiptData) => Promise<void>;
};

const PrinterContext = createContext<PrinterContextValue | null>(null);

/**
 * Holds the live Bluetooth printer connection for the whole authenticated
 * app. Mounted in the (app) layout — not per-page — so pairing once in
 * Settings keeps working when a cashier navigates to the till or receipt
 * preview; a per-page provider would drop the connection on every
 * navigation since Web Bluetooth device handles can't be serialised.
 */
export function PrinterProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printerRef = useRef<BluetoothPrinter | null>(null);
  // `navigator.bluetooth` doesn't exist during SSR, so this starts false
  // (matching the server-rendered markup) and is only updated after mount —
  // reading it directly here would render "unsupported" on the server and
  // "supported" on a Bluetooth-capable client, a hydration mismatch.
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isBluetoothPrintingSupported());
    return () => {
      printerRef.current?.disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    try {
      const printer = await BluetoothPrinter.request();
      printer.onDisconnect(() => {
        printerRef.current = null;
        setStatus("disconnected");
        setDeviceName(null);
      });
      printerRef.current = printer;
      setDeviceName(printer.name);
      setStatus("connected");
    } catch (err) {
      // A user cancelling the device picker isn't an error worth surfacing.
      const message = err instanceof Error ? err.message : "Could not connect to the printer.";
      if (!/cancelled|user gesture/i.test(message)) setError(message);
      setStatus("disconnected");
    }
  }, []);

  const disconnect = useCallback(() => {
    printerRef.current?.disconnect();
    printerRef.current = null;
    setStatus("disconnected");
    setDeviceName(null);
  }, []);

  const printReceipt = useCallback(async (data: ReceiptData) => {
    if (!printerRef.current) throw new Error("No printer connected.");
    await printerRef.current.write(buildReceipt(data));
  }, []);

  return (
    <PrinterContext.Provider value={{ supported, status, deviceName, error, connect, disconnect, printReceipt }}>
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter(): PrinterContextValue {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error("usePrinter must be used inside PrinterProvider");
  return ctx;
}
