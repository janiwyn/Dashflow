import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { viewTrackableOrder } from "@/db/queries/views";
import TrackOrderPage from "./track-order-client";

export const metadata: Metadata = {
  title: "Track Your Order \u2014 Meridian Retail",
  description: "Track the status of your online order using your order reference number.",
};

export default async function Page() {
  const trackableOrder = await viewTrackableOrder();
  if (!trackableOrder) notFound();
  return <TrackOrderPage trackableOrder={trackableOrder} />;
}
