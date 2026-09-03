import "server-only";

/**
 * Client for the NexumPay collection API (https://nexumpay.araknerd.com).
 * Auth is a two-step dance per call, not once up front: exchange
 * username/password/wallet for a short-lived auth token, then exchange that
 * for an API key — which the docs say expires after 120 seconds and describe
 * the auth token itself as "only used once to get the API key". That's too
 * short a window to cache the way AlieSMS's token is cached (src/lib/aliesms.ts)
 * — subscription payments are initiated minutes to months apart, never
 * back-to-back — so this fetches a fresh API key immediately before every
 * real call instead of trying to reuse one.
 */

const BASE_URL = process.env.NEXUM_BASE_URL ?? "https://nexumpayapi.araknerd.com";

export const nexumConfigured = Boolean(
  process.env.NEXUM_BASE_URL && process.env.NEXUM_USERNAME && process.env.NEXUM_PASSWORD && process.env.NEXUM_WALLET,
);

async function getApiKey(): Promise<string> {
  const username = process.env.NEXUM_USERNAME;
  const password = process.env.NEXUM_PASSWORD;
  const walletAddress = process.env.NEXUM_WALLET;
  if (!username || !password || !walletAddress) {
    throw new Error("NexumPay isn't configured — set NEXUM_BASE_URL, NEXUM_USERNAME, NEXUM_PASSWORD and NEXUM_WALLET.");
  }

  const tokenRes = await fetch(`${BASE_URL}/platform/api/generate_auth_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password, wallet_address: walletAddress }),
  });
  const tokenData = await tokenRes.json().catch(() => null);
  const authToken = tokenData?.details?.auth_token;
  if (!tokenRes.ok || tokenData?.status !== "OK" || !authToken) {
    throw new Error(tokenData?.message || `NexumPay sign-in failed (${tokenRes.status}).`);
  }

  const keyRes = await fetch(`${BASE_URL}/platform/api/generate_api_key`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  const keyData = await keyRes.json().catch(() => null);
  const apiKey = keyData?.details?.api_key;
  if (!keyRes.ok || keyData?.status !== "OK" || !apiKey) {
    throw new Error(keyData?.message || `NexumPay API key request failed (${keyRes.status}).`);
  }
  return apiKey as string;
}

async function authedPost(path: string, body: Record<string, unknown>): Promise<{ res: Response; data: unknown }> {
  const apiKey = await getApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

export type RequestPaymentResult = { ok: true } | { ok: false; error: string };

/**
 * Sends a mobile-money collection prompt to `phoneNumber` — the customer
 * approves it on their phone. `reference` must be unique per attempt; it's
 * what transaction_status and the webhook use to find their way back to it.
 */
export async function requestPayment(params: {
  phoneNumber: string;
  amount: number;
  narration: string;
  reference: string;
  callbackUrl?: string;
}): Promise<RequestPaymentResult> {
  try {
    const { res, data } = await authedPost("/platform/api/request_payment", {
      phone_number: params.phoneNumber,
      amount: String(Math.round(params.amount)),
      narration: params.narration,
      reference: params.reference,
      ...(params.callbackUrl ? { call_back_url: params.callbackUrl } : {}),
    });
    const body = data as { status?: string; message?: string } | null;
    if (!res.ok || body?.status !== "OK") {
      return { ok: false, error: body?.message || `NexumPay request failed (${res.status}).` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach NexumPay." };
  }
}

export type TransactionStatusResult =
  | { ok: true; status: "PENDING" | "SUCCESS" | "FAILED"; internalRef: string | null; amount: number | null; raw: unknown }
  | { ok: false; error: string };

export async function checkTransactionStatus(reference: string): Promise<TransactionStatusResult> {
  try {
    const { res, data } = await authedPost("/platform/api/transaction_status", { client_ref: reference });
    const body = data as { status?: string; message?: string; details?: Record<string, unknown> } | null;
    if (!res.ok || body?.status !== "OK") {
      return { ok: false, error: body?.message || `NexumPay status check failed (${res.status}).` };
    }
    const details = body.details ?? {};
    const rawStatus = String(details.status ?? "").toUpperCase();
    const status: "PENDING" | "SUCCESS" | "FAILED" = rawStatus === "SUCCESS" ? "SUCCESS" : rawStatus === "FAILED" ? "FAILED" : "PENDING";
    return {
      ok: true,
      status,
      internalRef: typeof details.internal_ref === "string" ? details.internal_ref : null,
      amount: details.amount != null ? Number(details.amount) : null,
      raw: data,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach NexumPay." };
  }
}
