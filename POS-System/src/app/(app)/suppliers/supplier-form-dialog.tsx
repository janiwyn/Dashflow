"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { createSupplier, updateSupplier } from "@/app/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { viewSuppliers } from "@/db/queries/views";

type Supplier = Awaited<ReturnType<typeof viewSuppliers>>[number];

type Props = {
  trigger: ReactNode;
  categories: { id: number; name: string }[];
  supplier?: Supplier;
  onSaved?: () => void;
};

export function SupplierFormDialog({ trigger, categories, supplier, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(supplier);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name") || ""),
      categoryId: fd.get("category_id") ? Number(fd.get("category_id")) : null,
      contact: String(fd.get("contact") || ""),
      contactPerson: String(fd.get("contact_person") || ""),
      email: String(fd.get("email") || ""),
      address: String(fd.get("address") || ""),
      paymentTerms: String(fd.get("payment_terms") || ""),
    };

    startTransition(async () => {
      const result = isEdit ? await updateSupplier({ id: supplier!.id, ...input }) : await createSupplier(input);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      onSaved?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit supplier" : "Add supplier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} method="post" className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Supplier name</Label>
            <Input name="name" defaultValue={supplier?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select name="category_id" defaultValue={supplier?.categoryId ? String(supplier.categoryId) : undefined}>
                <SelectTrigger><SelectValue placeholder="What do they supply?" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Contact person</Label>
              <Input name="contact_person" defaultValue={supplier?.contactPerson ?? ""} placeholder="e.g. John Kamau" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input name="contact" defaultValue={supplier?.contact ?? ""} placeholder="0712 345 678" />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" name="email" defaultValue={supplier?.email ?? ""} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Address</Label>
            <Input name="address" defaultValue={supplier?.address ?? ""} placeholder="Street, town" />
          </div>
          <div className="grid gap-1.5">
            <Label>Payment terms</Label>
            <Input name="payment_terms" defaultValue={supplier?.paymentTerms ?? ""} placeholder="e.g. Net 30, Cash on delivery" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="rounded-lg">
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
