import type { Metadata } from "next";

import { viewCustomerDebtorNotifs, viewLowStockNotifs, viewShopDebtorNotifs } from "@/db/queries/views";
import NotificationsPage from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Overdue debtors and low stock alerts requiring action.",
};

export default async function Page() {
  const [customerDebtorNotifs, lowStockNotifs, shopDebtorNotifs] = await Promise.all([viewCustomerDebtorNotifs(), viewLowStockNotifs(), viewShopDebtorNotifs()]);
  return <NotificationsPage customerDebtorNotifs={customerDebtorNotifs} lowStockNotifs={lowStockNotifs} shopDebtorNotifs={shopDebtorNotifs} />;
}
