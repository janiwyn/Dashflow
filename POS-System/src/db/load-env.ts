/**
 * Side-effect module for CLI scripts (seed, one-off tasks).
 *
 * Static imports are evaluated in declaration order, so importing this file
 * *before* "./index" guarantees DATABASE_URL exists by the time the Neon client
 * is constructed. Next.js loads .env.local itself, so this is only for tsx.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
