import type { Metadata } from "next";

import { viewSmsLogs } from "@/db/queries/views";
import SmsPage from "./sms-client";

export const metadata: Metadata = {
  title: "SMS Alerts",
  description: "Send SMS notifications and review the delivery log.",
};

export default async function Page() {
  const smsLogs = await viewSmsLogs();
  return <SmsPage smsLogs={smsLogs} />;
}
