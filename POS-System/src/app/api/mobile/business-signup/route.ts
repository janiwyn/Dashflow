import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { completeBusinessSignup } from "@/app/actions/signup";
import type { ModuleKey } from "@/lib/modules";

/**
 * The mobile PWA (a separate Laravel app) has no cookie session with this
 * app, so it can't call the `finishBusinessSignup` server action directly —
 * it authenticates the same way every other Laravel endpoint does: by
 * passing the bearer token from the just-completed better-auth sign-up
 * straight through, resolved here against the same `session` table.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ message: "Missing bearer token." }, { status: 401 });
  }

  const [row] = await db
    .select({ userId: sessions.userId, businessId: users.businessId })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) {
    return NextResponse.json({ message: "Session expired or invalid." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const businessName = String(body.businessName ?? "").trim();
  const role = body.role === "manager" ? "manager" : "admin";
  const moduleKeys = Array.isArray(body.moduleKeys) ? (body.moduleKeys as ModuleKey[]) : [];

  const result = await completeBusinessSignup(row.userId, row.businessId, {
    businessName,
    role,
    moduleKeys,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
