import type { Metadata } from "next";

import { viewPendingOrders } from "@/db/queries/views";
import OrderNotificationsPage from "./order-notifications-client";
import { requireModule } from "@/lib/module-access";

export const metadata: Metadata = {
  title: "Order Alerts",
  description: "Remote orders waiting to be picked up or fulfilled.",
};

export default async function Page() {
  await requireModule("sales");
  const pendingOrders = await viewPendingOrders();
  return <OrderNotificationsPage pendingOrders={pendingOrders} />;
}
