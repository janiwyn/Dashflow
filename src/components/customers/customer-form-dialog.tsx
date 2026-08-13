"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { createCustomer, updateCustomer } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { viewCustomers } from "@/db/queries/views";

type Customer = Awaited<ReturnType<typeof viewCustomers>>[number];

type Props = {
  trigger: ReactNode;
  customer?: Customer;
  onSaved?: () => void;
};

export function CustomerFormDialog({ trigger, customer, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(customer);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name") || ""),
      type: (fd.get("type") === "wholesale" ? "wholesale" : "retail") as "retail" | "wholesale",
      contact: String(fd.get("contact") || ""),
      email: String(fd.get("email") || ""),
      preferredPaymentMethod: String(fd.get("payment_method") || ""),
    };

    startTransition(async () => {
      const result = isEdit ? await updateCustomer({ id: customer!.id, ...input }) : await createCustomer(input);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add customer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Customer name</Label>
            <Input name="name" defaultValue={customer?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select name="type" defaultValue={customer?.rawType === "wholesale" ? "wholesale" : "retail"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Preferred payment</Label>
              <Input name="payment_method" defaultValue={customer?.preferredPaymentMethod ?? ""} placeholder="e.g. Mobile Money, Invoice" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Contact</Label>
              <Input name="contact" defaultValue={customer?.contact ?? ""} placeholder="0712 345 678" />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" name="email" defaultValue={customer?.email ?? ""} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="rounded-lg">
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
