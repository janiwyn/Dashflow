import { NextResponse } from "next/server";

import { applySuccessfulPaymentByReference, markSubscriptionPaymentFailed } from "@/lib/subscription-payments";

/**
 * NexumPay's own docs don't specify this callback's payload shape at all —
 * only that `call_back_url` gets "webhook for status updates" — so this
 * reads defensively across a few plausible key names instead of assuming
 * one exact shape, and stores whatever it received on the payment row either
 * way for support/debugging against an undocumented gateway.
 *
 * There's no documented signature to verify, so authenticity instead comes
 * from what happens after: this can only ever resolve a payment row that
 * already exists and is still "pending" (see applySuccessfulPaymentByReference's
 * atomic pending->success guard) — an attacker who discovers this URL and
 * POSTs a guessed or replayed reference can at most re-trigger a no-op on an
 * already-resolved payment, never fabricate or double-apply one. The client
 * polling loop (checkSubscriptionPaymentStatus) independently re-verifies
 * with NexumPay too, so this callback is an optimization, not the only path
 * to getting paid.
 */

function extractField(body: unknown, keys: string[]): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const obj = body as Record<string, unknown>;
  for (const key of keys) {
    if (typeof obj[key] === "string") return obj[key];
  }
  return typeof obj.details === "object" ? extractField(obj.details, keys) : undefined;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const reference = extractField(body, ["client_ref", "reference", "clientRef"]);
  const status = extractField(body, ["status", "trans_status"])?.toUpperCase();

  if (!reference) {
    return NextResponse.json({ ok: false, message: "Missing reference." }, { status: 400 });
  }

  if (status === "SUCCESS") {
    await applySuccessfulPaymentByReference(reference, body);
  } else if (status === "FAILED") {
    await markSubscriptionPaymentFailed(reference, body);
  }
  // Any other/unknown status: leave it pending — the client's own poll (or a
  // later callback) resolves it. Always 200 so NexumPay doesn't retry-storm this.
  return NextResponse.json({ ok: true });
}
