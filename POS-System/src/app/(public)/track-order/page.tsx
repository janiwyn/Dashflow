import type { Metadata } from "next";

import { CurrencyProvider } from "@/components/currency-provider";
import { viewTrackableOrder } from "@/db/queries/views";
import { getBusinessProfile } from "@/db/queries/profile";
import type { CurrencyCode } from "@/lib/currency";
import TrackOrderPage from "./track-order-client";

export const metadata: Metadata = {
  title: "Track Your Order — Dashflow Retail",
  description: "Track the status of your online order using your order reference number.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const [trackableOrder, business] = await Promise.all([viewTrackableOrder(ref), getBusinessProfile()]);
  return (
    <CurrencyProvider code={(business?.currency as CurrencyCode) ?? "UGX"}>
      <TrackOrderPage initialRef={ref ?? ""} trackableOrder={trackableOrder} notFound={Boolean(ref) && !trackableOrder} />
    </CurrencyProvider>
  );
}
