"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ImageIcon, Plus, XCircle } from "lucide-react";

import { createPaymentProof, reviewPaymentProof } from "@/app/actions/payment-proofs";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PaymentProof } from "@/db/queries/views";
import type { viewBranchOptions, viewHrBranches, viewPaymentProofs } from "@/db/queries/views";

type Props = {
  branchNames: Awaited<ReturnType<typeof viewBranchOptions>>;
  branchOptions: Awaited<ReturnType<typeof viewHrBranches>>;
  paymentProofs: Awaited<ReturnType<typeof viewPaymentProofs>>;
};

function StatusBadge({ status }: { status: PaymentProof["status"] }) {
  const tone =
    status === "Pending" ? "bg-warning/15 text-warning-foreground" : status === "Verified" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{status}</span>;
}

export default function PaymentProofsPage({ branchNames, branchOptions, paymentProofs }: Props) {
  const router = useRouter();
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all");
  const [viewing, setViewing] = useState<PaymentProof | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => paymentProofs.filter((p) => (branch === "all" || p.branch === branch) && (status === "all" || p.status === status)),
    [paymentProofs, branch, status],
  );

  const review = (id: number, next: "verified" | "rejected") => {
    startTransition(async () => {
      const result = await reviewPaymentProof(id, next);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  };

  const columns: Column<PaymentProof>[] = [
    { key: "ref", header: "Order Ref", render: (r) => <span className="num font-medium">{r.ref}</span> },
    { key: "branch", header: "Branch", render: (r) => r.branch },
    { key: "customer", header: "Customer", render: (r) => r.customer },
    { key: "phone", header: "Phone", render: (r) => <span className="num text-muted-foreground">{r.phone}</span> },
    { key: "location", header: "Delivery Location", render: (r) => r.location },
    {
      key: "screenshot",
      header: "Screenshot",
      render: (r) =>
        r.imagePath ? (
          <Button variant="outline" size="sm" className="h-7 rounded-lg text-xs" onClick={() => setViewing(r)}>
            <ImageIcon className="mr-1 size-3.5" /> View
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">No image</span>
        ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "date", header: "Date", render: (r) => <span className="num text-muted-foreground">{r.date}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "Pending" ? (
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 rounded-lg text-xs" onClick={() => review(r.id, "verified")} disabled={pending}>
              <CheckCircle2 className="mr-1 size-3.5" /> Verify
            </Button>
            <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs text-destructive" onClick={() => review(r.id, "rejected")} disabled={pending}>
              <XCircle className="mr-1 size-3.5" /> Reject
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={branch} onValueChange={setBranch}>
        <SelectTrigger className="h-9 w-[140px] rounded-lg text-sm"><SelectValue placeholder="Branch" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All branches</SelectItem>
          {branchNames.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="h-9 w-[140px] rounded-lg text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Verified">Verified</SelectItem>
          <SelectItem value="Rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AppShell
      title="Payment Proofs"
      subtitle="Verify mobile money payments for remote orders"
      actions={
        <AddPaymentProofDialog
          branches={branchOptions}
          trigger={
            <Button size="sm" className="rounded-lg">
              <Plus className="size-4" /> Log payment proof
            </Button>
          }
          onSaved={() => router.refresh()}
        />
      }
    >
      <Tabs defaultValue="mtn">
        <TabsList>
          <TabsTrigger value="mtn">MTN Mobile Money</TabsTrigger>
          <TabsTrigger value="airtel">Airtel Money</TabsTrigger>
        </TabsList>
        <TabsContent value="mtn" className="mt-4">
          <DataTable
            title="MTN Mobile Money payment proofs"
            columns={columns}
            rows={filtered.filter((p) => p.method === "MTN Merchant")}
            toolbar={toolbar}
          />
        </TabsContent>
        <TabsContent value="airtel" className="mt-4">
          <DataTable
            title="Airtel Money payment proofs"
            columns={columns}
            rows={filtered.filter((p) => p.method === "Airtel Merchant")}
            toolbar={toolbar}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(viewing)} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.ref} — {viewing?.customer}</DialogTitle>
          </DialogHeader>
          {viewing?.imagePath && (
            // eslint-disable-next-line @next/next/no-img-element -- data-URL screenshot, not an optimizable remote asset
            <img src={viewing.imagePath} alt={`Payment screenshot for ${viewing.ref}`} className="max-h-[70vh] w-full rounded-lg border border-border object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* --------------------------------------------------------------- Add */

function AddPaymentProofDialog({
  trigger,
  branches,
  onSaved,
}: {
  trigger: React.ReactNode;
  branches: Awaited<ReturnType<typeof viewHrBranches>>;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"mtn_merchant" | "airtel_merchant">("mtn_merchant");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleFile = (file: File | undefined) => {
    if (!file) {
      setImageDataUrl(null);
      setImageName(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image is too large — keep it under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageDataUrl) {
      toast.error("Attach a screenshot image.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const input = {
      reference: String(fd.get("reference") || ""),
      branchId: fd.get("branch_id") ? Number(fd.get("branch_id")) : null,
      customerName: String(fd.get("customer_name") || ""),
      phone: String(fd.get("phone") || ""),
      location: String(fd.get("location") || ""),
      method,
      imageDataUrl,
    };

    startTransition(async () => {
      const result = await createPaymentProof(input);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      setImageDataUrl(null);
      setImageName(null);
      onSaved();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log a payment proof</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Order reference</Label><Input name="reference" placeholder="e.g. RO-1234" required /></div>
            <div className="grid gap-1.5">
              <Label>Branch</Label>
              <Select name="branch_id">
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Customer name</Label><Input name="customer_name" required /></div>
            <div className="grid gap-1.5"><Label>Phone</Label><Input name="phone" placeholder="0772 345 678" /></div>
          </div>
          <div className="grid gap-1.5"><Label>Delivery location</Label><Input name="location" /></div>
          <div className="grid gap-1.5">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn_merchant">MTN Mobile Money</SelectItem>
                <SelectItem value="airtel_merchant">Airtel Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Screenshot</Label>
            <Input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
            {imageName && <p className="text-xs text-muted-foreground">Attached: {imageName}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="rounded-lg">{pending ? "Saving…" : "Log for review"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
