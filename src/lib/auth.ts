import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db, schema } from "@/db";

/**
 * OAuth is optional: a provider is only registered when both of its
 * credentials are present, so the app boots fine without them. The login page
 * reads `configuredProviders` to disable the buttons it cannot honour.
 */
const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
const appleId = process.env.APPLE_CLIENT_ID;
const appleSecret = process.env.APPLE_CLIENT_SECRET;

export const configuredProviders = {
  google: Boolean(googleId && googleSecret),
  apple: Boolean(appleId && appleSecret),
};

export const auth = betterAuth({
  appName: "Meridian POS",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    // No mail transport is wired up yet. Logging the link keeps the flow usable
    // in development; swap this for your provider's send call in production.
    sendResetPassword: async ({ user, url }) => {
      console.info(`[auth] password reset for ${user.email}: ${url}`);
    },
  },

  socialProviders: {
    ...(configuredProviders.google
      ? { google: { clientId: googleId!, clientSecret: googleSecret! } }
      : {}),
    ...(configuredProviders.apple
      ? {
          apple: {
            clientId: appleId!,
            clientSecret: appleSecret!,
            ...(process.env.APPLE_APP_BUNDLE_IDENTIFIER
              ? { appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER }
              : {}),
          },
        }
      : {}),
  },

  account: {
    accountLinking: {
      // Google and Apple both return verified addresses, so linking to an
      // existing email/password account is safe and avoids duplicate users.
      enabled: true,
      trustedProviders: ["google", "apple"],
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  user: {
    additionalFields: {
      username: { type: "string", required: false },
      phone: { type: "string", required: false },
      // `input: false` keeps privilege fields out of the public signup payload —
      // a client cannot promote itself to admin by posting role:"admin".
      role: { type: "string", required: false, defaultValue: "staff", input: false },
      status: { type: "string", required: false, defaultValue: "active", input: false },
      theme: { type: "string", required: false, defaultValue: "light" },
      businessId: { type: "number", required: false, input: false },
      branchId: { type: "number", required: false, input: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
