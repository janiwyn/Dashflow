<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Ports the web app's `lib/aliesms.ts` client for the AlieSMS gateway
 * (https://aliesms.com/#developers) exactly — same two endpoints, same
 * bearer-token dance, same 401-triggers-one-retry behavior, same
 * "Dashflow: " message prefix.
 *
 * One deliberate adaptation: the web app caches the token in a module-scope
 * variable, which survives across requests only because Node keeps one long-
 * lived server process. PHP has no equivalent (each request is its own
 * process here), so the same "don't re-authenticate on every request" intent
 * is achieved via Laravel's cache store instead — same effect, different
 * mechanism forced by the runtime, not a behavior change.
 */
class AliesmsClient
{
    const BASE_URL = 'https://developer.aliesms.com/api';

    const TOKEN_CACHE_KEY = 'aliesms_token';

    public static function configured(): bool
    {
        return filled(config('services.aliesms.email')) && filled(config('services.aliesms.password'));
    }

    private static function token(): string
    {
        if (Cache::has(self::TOKEN_CACHE_KEY)) {
            return Cache::get(self::TOKEN_CACHE_KEY);
        }

        $email = config('services.aliesms.email');
        $password = config('services.aliesms.password');
        if (! $email || ! $password) {
            throw new \RuntimeException("AlieSMS isn't configured — set ALIESMS_EMAIL and ALIESMS_PASSWORD.");
        }

        $res = Http::acceptJson()->post(self::BASE_URL.'/token/generate.php', ['email' => $email, 'password' => $password]);
        $data = $res->json();
        if (! $res->successful() || empty($data['token'])) {
            throw new \RuntimeException($data['message'] ?? "AlieSMS sign-in failed ({$res->status()}).");
        }

        Cache::put(self::TOKEN_CACHE_KEY, $data['token'], now()->addHours(6));

        return $data['token'];
    }

    private static function authedRequest(string $method, string $path, array $body = [], bool $allowRetry = true)
    {
        $res = Http::acceptJson()->withToken(self::token())->{$method}(self::BASE_URL.$path, $body);

        if ($res->status() === 401 && $allowRetry) {
            Cache::forget(self::TOKEN_CACHE_KEY);

            return self::authedRequest($method, $path, $body, false);
        }

        return $res;
    }

    /** @return array{ok:true,smsCount:int,totalRecipients:int,invalidNumbers:array}|array{ok:false,error:string} */
    public static function sendBatch(string $batchName, string $message, array $recipients): array
    {
        try {
            $res = self::authedRequest('post', '/message/batch/create.php', [
                'batch_name' => $batchName,
                'message_text' => "Dashflow: {$message}",
                'recipients' => implode(', ', $recipients),
            ]);
            $data = $res->json();
            if (! $res->successful() || ($data['status'] ?? null) !== 'OK') {
                return ['ok' => false, 'error' => $data['message'] ?? "AlieSMS request failed ({$res->status()})."];
            }

            return [
                'ok' => true,
                'smsCount' => (int) ($data['smsCount'] ?? 0),
                'totalRecipients' => (int) ($data['total_recipients'] ?? count($recipients)),
                'invalidNumbers' => is_array($data['invalid_numbers'] ?? null) ? $data['invalid_numbers'] : [],
            ];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage() ?: 'Could not reach AlieSMS.'];
        }
    }

    /**
     * @return array{ok:true,balance:float,currency:string}|array{ok:false,error:string}
     *
     * Checks status against "OK", not "success" — the web app's own equivalent
     * checks for "success", but the live gateway actually returns
     * {"status":"OK",...} on this endpoint (confirmed by calling it directly),
     * same as the batch-send endpoint already correctly checks. That mismatch
     * means the web app's balance card is permanently broken in production —
     * a real functional bug, not something to replicate.
     */
    public static function balance(): array
    {
        try {
            $res = self::authedRequest('get', '/user/balance.php');
            $data = $res->json();
            if (! $res->successful() || strtolower((string) ($data['status'] ?? '')) !== 'ok') {
                return ['ok' => false, 'error' => $data['message'] ?? "AlieSMS request failed ({$res->status()})."];
            }

            return ['ok' => true, 'balance' => (float) ($data['balance'] ?? 0), 'currency' => $data['currency'] ?? 'UGX'];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage() ?: 'Could not reach AlieSMS.'];
        }
    }
}
