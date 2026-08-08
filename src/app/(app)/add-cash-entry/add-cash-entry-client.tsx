"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/components/currency-provider";
import type { viewCashBookEntries } from "@/db/queries/views";

type Props = {
  seedEntries: Awaited<ReturnType<typeof viewCashBookEntries>>;
};

type Entry = { date: string; particulars: string; cashIn: number; bankIn: number; cashOut: number; bankOut: number; source: string };

export default function AddCashEntryPage({ seedEntries }: Props) {
  const { format: currency } = useCurrency();
  const [entries, setEntries] = useState<Entry[]>(seedEntries);
  const [date, setDate] = useState("");
  const [type, setType] = useState("receipt");
  const [particulars, setParticulars] = useState("");
  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");

  const save = () => {
    if (!date || !particulars) return;
    const c = parseFloat(cash || "0");
    const b = parseFloat(bank || "0");
    const entry: Entry =
      type === "receipt"
        ? { date, particulars, cashIn: c, bankIn: b, cashOut: 0, bankOut: 0, source: "Manual Entry" }
        : { date, particulars, cashIn: 0, bankIn: 0, cashOut: c, bankOut: b, source: "Manual Entry" };
    setEntries([entry, ...entries]);
    setDate("");
    setParticulars("");
    setCash("");
    setBank("");
  };

  const columns: Column<Entry>[] = [
    { key: "date", header: "Date", render: (e) => <span className="num text-muted-foreground">{e.date}</span> },
    { key: "particulars", header: "Particulars", render: (e) => e.particulars },
    { key: "cashIn", header: "Cash In", align: "right", render: (e) => <span className="num">{e.cashIn ? currency(e.cashIn) : ""}</span> },
    { key: "bankIn", header: "Bank In", align: "right", render: (e) => <span className="num">{e.bankIn ? currency(e.bankIn) : ""}</span> },
    { key: "cashOut", header: "Cash Out", align: "right", render: (e) => <span className="num">{e.cashOut ? currency(e.cashOut) : ""}</span> },
    { key: "bankOut", header: "Bank Out", align: "right", render: (e) => <span className="num">{e.bankOut ? currency(e.bankOut) : ""}</span> },
    { key: "source", header: "Source", render: (e) => <span className="text-muted-foreground">{e.source}</span> },
  ];

  return (
    <AppShell title="Cash Book" subtitle="Record manual cash and bank entries">
      <section className="panel p-5">
        <h2 className="mb-4 text-base font-semibold">Manual entry</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Particulars</Label>
            <Input value={particulars} onChange={(e) => setParticulars(e.target.value)} placeholder="Description" />
          </div>
          <div className="space-y-1.5">
            <Label>Cash Amount (KES)</Label>
            <Input type="number" value={cash} onChange={(e) => setCash(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Bank Amount (KES)</Label>
            <Input type="number" value={bank} onChange={(e) => setBank(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save} className="rounded-lg">Save Entry</Button>
        </div>
      </section>

      <DataTable title="All cash entries" columns={columns} rows={entries} minWidth={880} />
    </AppShell>
  );
}
