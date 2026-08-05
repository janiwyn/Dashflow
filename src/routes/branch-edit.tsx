import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { branchesData } from "@/lib/branch-data";

export const Route = createFileRoute("/branch-edit")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: Number(search["id"]) || 1,
  }),
  head: () => ({
    meta: [
      { title: "Edit Branch — Meridian POS" },
      { name: "description", content: "Update a branch's name, location and contact details." },
      { property: "og:title", content: "Edit Branch — Meridian POS" },
      { property: "og:description", content: "Update branch information." },
    ],
  }),
  component: BranchEditPage,
});

function BranchEditPage() {
  const { id } = Route.useSearch();
  const branch = branchesData.find((b) => b.id === id) ?? branchesData[0]!;
  const [name, setName] = useState(branch.name);
  const [location, setLocation] = useState(branch.location);
  const [contact, setContact] = useState(branch.contact);
  const [message, setMessage] = useState("");

  return (
    <AppShell
      title="Edit Branch"
      subtitle={branch.name}
      actions={
        <Link to="/list-branches">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ArrowLeft className="size-4" /> Back
          </Button>
        </Link>
      }
    >
      <div className="panel mx-auto w-full max-w-lg p-6">
        {message && (
          <div className="mb-4 rounded-lg bg-success/12 px-4 py-2.5 text-sm text-success">{message}</div>
        )}
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage("Branch updated successfully!");
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Branch name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact">Contact</Label>
            <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} required />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="rounded-lg">
              Update branch
            </Button>
            <Link to="/list-branches">
              <Button type="button" variant="secondary" className="rounded-lg">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}