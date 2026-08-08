import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CurrencyProvider } from "@/components/currency-provider";
import { viewTrackableOrder } from "@/db/queries/views";
import { getBusinessProfile } from "@/db/queries/profile";
import type { CurrencyCode } from "@/lib/currency";
import TrackOrderPage from "./track-order-client";

export const metadata: Metadata = {
  title: "Track Your Order \u2014 Dashflow Retail",
  description: "Track the status of your online order using your order reference number.",
};

export default async function Page() {
  const [trackableOrder, business] = await Promise.all([viewTrackableOrder(), getBusinessProfile()]);
  if (!trackableOrder) notFound();
  return (
    <CurrencyProvider code={(business?.currency as CurrencyCode) ?? "KES"}>
      <TrackOrderPage trackableOrder={trackableOrder} />
    </CurrencyProvider>
  );
}
