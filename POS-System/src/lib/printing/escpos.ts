/**
 * Minimal ESC/POS command builder for thermal receipt printers. Covers just
 * what a till receipt needs — init, alignment, bold, a cut — not a general
 * ESC/POS library. Output is raw bytes, sent as-is over Bluetooth/USB/etc;
 * the printer itself doesn't care which transport carried them.
 */

const ESC = 0x1b;
const GS = 0x1d;

const CTRL = {
  init: [ESC, 0x40],
  alignLeft: [ESC, 0x61, 0x00],
  alignCenter: [ESC, 0x61, 0x01],
  alignRight: [ESC, 0x61, 0x02],
  boldOn: [ESC, 0x45, 0x01],
  boldOff: [ESC, 0x45, 0x00],
  doubleOn: [GS, 0x21, 0x11],
  doubleOff: [GS, 0x21, 0x00],
  feed: (lines: number) => [ESC, 0x64, lines],
  cut: [GS, 0x56, 0x00],
};

export type ReceiptLineItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptData = {
  businessName: string;
  tagline?: string | null;
  reference: string;
  date: string;
  cashier?: string | null;
  customer?: string | null;
  method?: string | null;
  items: ReceiptLineItem[];
  subtotal: number;
  total: number;
  currencySymbol: string;
  footer?: string;
};

/** Paper is narrow — 32 columns fits both 58mm and 80mm rolls safely. */
const WIDTH = 32;

function twoCol(left: string, right: string): string {
  const space = WIDTH - left.length - right.length;
  if (space < 1) return `${left.slice(0, WIDTH - right.length - 1)} ${right}`;
  return left + " ".repeat(space) + right;
}

function money(amount: number, symbol: string): string {
  return `${symbol} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function wrap(text: string, width = WIDTH): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Builds the raw byte stream for a till receipt, ready to send to a printer. */
export function buildReceipt(data: ReceiptData): Uint8Array {
  const out: number[] = [...CTRL.init];
  const raw = (...cmd: number[]) => out.push(...cmd);
  const push = (s: string) => out.push(...Array.from(new TextEncoder().encode(s)));
  const line = (s = "") => push(s + "\n");

  raw(...CTRL.alignCenter, ...CTRL.doubleOn);
  line(data.businessName);
  raw(...CTRL.doubleOff);
  if (data.tagline) line(data.tagline);
  line("-".repeat(WIDTH));

  raw(...CTRL.alignLeft);
  line(twoCol("Ref:", data.reference));
  line(twoCol("Date:", data.date));
  if (data.cashier) line(twoCol("Cashier:", data.cashier));
  if (data.customer) line(twoCol("Customer:", data.customer));
  if (data.method) line(twoCol("Payment:", data.method));
  line("-".repeat(WIDTH));

  for (const item of data.items) {
    for (const wrapped of wrap(item.name)) line(wrapped);
    line(
      twoCol(
        `  ${item.qty} x ${money(item.unitPrice, data.currencySymbol)}`,
        money(item.lineTotal, data.currencySymbol),
      ),
    );
  }
  line("-".repeat(WIDTH));

  raw(...CTRL.boldOn);
  line(twoCol("Subtotal", money(data.subtotal, data.currencySymbol)));
  line(twoCol("TOTAL", money(data.total, data.currencySymbol)));
  raw(...CTRL.boldOff);
  line();

  raw(...CTRL.alignCenter);
  line(data.footer ?? "Thank you for your business!");
  line();
  line();
  line();

  raw(...CTRL.feed(3), ...CTRL.cut);
  return new Uint8Array(out);
}
