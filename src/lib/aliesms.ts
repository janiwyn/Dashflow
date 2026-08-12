import "server-only";

/**
 * Client for the AlieSMS gateway (https://aliesms.com/#developers). Auth is
 * a two-step dance: exchange an email/password for a bearer token, then use
 * that token on every other call. The docs don't show a token lifetime, so
 * this treats a 401 as "expired" and re-authenticates once before giving up
 * — cheaper than re-authenticating on every request, and self-healing if
 * the cached token goes stale.
 */

const BASE_URL = "https://developer.aliesms.com/api";

export const aliesmsConfigured = Boolean(process.env.ALIESMS_EMAIL && process.env.ALIESMS_PASSWORD);

// Module-scope cache: reused across requests within the same server
// process. Worst case on a cold start is one extra token request.
let cachedToken: string | null = null;

async function requestToken(): Promise<string> {
  const email = process.env.ALIESMS_EMAIL;
  const password = process.env.ALIESMS_PASSWORD;
  if (!email || !password) {
    throw new Error("AlieSMS isn't configured — set ALIESMS_EMAIL and ALIESMS_PASSWORD.");
  }

  const res = await fetch(`${BASE_URL}/token/generate.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.token) {
    throw new Error(data?.message || `AlieSMS sign-in failed (${res.status}).`);
  }
  return data.token as string;
}

async function authedFetch(path: string, init: RequestInit, allowRetry = true): Promise<Response> {
  if (!cachedToken) cachedToken = await requestToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // The docs don't spell out the header format for authenticated calls
      // — this follows the standard bearer-token convention their token
      // endpoint implies. If AlieSMS expects something else, this is the
      // one place to change.
      Authorization: `Bearer ${cachedToken}`,
      ...init.headers,
    },
  });

  if (res.status === 401 && allowRetry) {
    cachedToken = null;
    return authedFetch(path, init, false);
  }
  return res;
}

export type SendSmsResult =
  | { ok: true; smsCount: number; totalRecipients: number; invalidNumbers: string[] }
  | { ok: false; error: string };

export async function sendBatchSms(params: {
  batchName: string;
  message: string;
  recipients: string[];
}): Promise<SendSmsResult> {
  try {
    const res = await authedFetch("/message/batch/create.php", {
      method: "POST",
      body: JSON.stringify({
        batch_name: params.batchName,
        message_text: `Dashflow: ${params.message}`,
        recipients: params.recipients.join(", "),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.status !== "OK") {
      return { ok: false, error: data?.message || `AlieSMS request failed (${res.status}).` };
    }
    return {
      ok: true,
      smsCount: Number(data.smsCount ?? 0),
      totalRecipients: Number(data.total_recipients ?? params.recipients.length),
      invalidNumbers: Array.isArray(data.invalid_numbers) ? data.invalid_numbers : [],
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach AlieSMS." };
  }
}

export type BalanceResult = { ok: true; balance: number; currency: string } | { ok: false; error: string };

export async function getAliesmsBalance(): Promise<BalanceResult> {
  try {
    const res = await authedFetch("/user/balance.php", { method: "GET" });
    const data = await res.json().catch(() => null);
    if (!res.ok || String(data?.status).toLowerCase() !== "success") {
      return { ok: false, error: data?.message || `AlieSMS request failed (${res.status}).` };
    }
    return { ok: true, balance: Number(data.balance ?? 0), currency: data.currency ?? "UGX" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach AlieSMS." };
  }
}
