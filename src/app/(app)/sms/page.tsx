import type { Metadata } from "next";

import { viewSmsLogs } from "@/db/queries/views";
import { aliesmsConfigured, getAliesmsBalance } from "@/lib/aliesms";
import SmsPage from "./sms-client";

export const metadata: Metadata = {
  title: "SMS Alerts",
  description: "Send SMS notifications via AlieSMS and review the delivery log.",
};

export default async function Page() {
  const [smsLogs, balance] = await Promise.all([
    viewSmsLogs(),
    aliesmsConfigured ? getAliesmsBalance() : Promise.resolve(null),
  ]);
  return <SmsPage smsLogs={smsLogs} configured={aliesmsConfigured} balance={balance} />;
}
