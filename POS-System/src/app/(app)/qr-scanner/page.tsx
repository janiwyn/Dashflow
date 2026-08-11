import type { Metadata } from "next";

import { viewRemoteOrders } from "@/db/queries/views";
import QrScannerPage from "./qr-scanner-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "QR Scanner",
  description: "Scan a customer's order QR code to pull up their remote order and record the sale.",
};

export default async function Page() {
  await requireModule("pos");
  const remoteOrders = await viewRemoteOrders();
  return <QrScannerPage remoteOrders={remoteOrders} />;
}
