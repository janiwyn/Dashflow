import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/session";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dashflow POS",
    template: "%s — Dashflow POS",
  },
  description: "Retail point of sale, inventory and branch management.",
  authors: [{ name: "Dashflow" }],
  openGraph: { type: "website", title: "Dashflow POS" },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Theme is a per-account preference, not a per-device one — a shared POS
  // terminal sees many different staff log in and out through a shift, and
  // one person's dark-mode choice must never leak into the next person's
  // session. So the class is rendered from the signed-in user's own `theme`
  // column, not from localStorage (which is scoped to the browser, not the
  // account). Signed-out visitors (marketing, login) always render light.
  const user = await getCurrentUser();

  return (
    <html lang="en" className={user?.theme === "dark" ? "dark" : undefined} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
