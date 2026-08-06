import type { Metadata } from "next";

import { viewBranchOptions, viewRemoteOrders } from "@/db/queries/views";
import RemoteOrdersPage from "./remote-orders-client";

export const metadata: Metadata = {
  title: "Remote Orders",
  description: "Review, verify and process customer orders placed through the online storefront.",
};

export default async function Page() {
  const [branches, remoteOrders] = await Promise.all([viewBranchOptions(), viewRemoteOrders()]);
  return <RemoteOrdersPage branches={branches} remoteOrders={remoteOrders} />;
}
