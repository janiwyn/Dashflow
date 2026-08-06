import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
  );
}

/**
 * Neon's HTTP driver: one round trip per query, no connection pool to manage,
 * which is what serverless/edge-style Next.js request handling wants.
 * Note it does not support interactive transactions — use `db.batch()` for
 * atomic multi-statement writes.
 */
const sql = neon(connectionString);

export const db = drizzle(sql, { schema, casing: "snake_case" });

export { schema };
export type Db = typeof db;
