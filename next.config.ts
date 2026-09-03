import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  serverExternalPackages: ["@neondatabase/serverless"],
  // Next.js dev mode blocks cross-origin requests to dev-only assets
  // (JS bundles, HMR, RSC data) by default — without this, loading the app
  // from another device's browser (e.g. a phone on the same LAN, testing a
  // real payment prompt) serves a page that never actually hydrates, so
  // every button silently does nothing.
  allowedDevOrigins: process.env.LAN_DEV_ORIGIN ? [new URL(process.env.LAN_DEV_ORIGIN).hostname] : undefined,
};

export default nextConfig;
