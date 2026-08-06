# Meridian POS

Retail point of sale, inventory, HR, accounting and multi-branch management.

**Stack:** Next.js 16 (App Router) · React 19 · Drizzle ORM · Neon Postgres · better-auth · Tailwind v4 · shadcn/ui

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:migrate           # apply migrations to Neon
npm run db:seed              # load demo data
npm run dev
```

Open http://localhost:3000.

### Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (use the **pooled** endpoint) |
| `BETTER_AUTH_SECRET` | Session signing secret — `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public origin, e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional — enables the Google button |
| `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` | Optional — enables the Apple button |

## Authentication

Email/password plus optional Google and Apple OAuth, all on better-auth.

- **Social sign-in** is registered only when a provider's credentials are both
  present. Without them the button renders **disabled** rather than hidden, so
  missing setup is visible instead of failing at the redirect. Callback URLs are
  `<BETTER_AUTH_URL>/api/auth/callback/{google,apple}`. Account linking is on for
  both providers, so signing in with Google using an existing account's address
  attaches to that user rather than creating a duplicate.
- **Forgot password** — `/forgot-password` requests a link, which lands on
  `/new-password?token=…`. Tokens are single-use and expire after an hour, and
  the request form reports the same message whether or not the address exists,
  so it can't be used to enumerate accounts.
- **No mail transport is wired up.** `sendResetPassword` in
  [src/lib/auth.ts](src/lib/auth.ts) logs the reset link to the server console;
  swap it for your provider's send call before going live.
- `/reset-password` is a separate **admin** tool for resetting another user's
  password to the default, not part of the self-service flow.

### Demo logins

`npm run db:seed` creates these accounts, all with the password `password123`:

| Email | Role |
| --- | --- |
| `super@meridianpos.co.ke` | Super admin — platform console |
| `admin@meridianpos.co.ke` | Business admin |
| `jkamau@meridianpos.co.ke` | Branch manager |
| `amwangi@meridianpos.co.ke` | Cashier / staff |

The seed is **destructive** (it truncates every table) and anchors all demo data
to the day it runs, so today's figures are always populated. Re-run it whenever
the dashboard looks stale.

## Layout

```
src/
  app/
    (app)/          authenticated screens; layout guards the session
    (auth)/         login, signup
    (public)/       customer storefront and order tracking
    actions/        "use server" mutations
    api/auth/       better-auth handler
  db/
    schema/         Drizzle tables, one file per domain
    queries/        server-only reads (tenant-scoped)
    seed.ts         demo data
  components/       shared UI (shadcn) + app shell
  lib/              auth, session helpers, formatting
```

### Data access

- `src/db/queries/*` are **server-only** reads. Every query is scoped to the
  signed-in user's business via `businessScope()`.
- `src/db/queries/views.ts` returns presentation-shaped rows for the screens.
- Mutations live in `src/app/actions/*` and revalidate the affected paths.
- Pages are server components that fetch data and hand it to a `*-client.tsx`
  island. Functions (table `render` callbacks, lucide icons) cannot cross the
  server/client boundary, so any screen using `DataTable` or `StatCard` is a
  client component.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | oxlint |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema without a migration (dev only) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Reset and reseed demo data |
