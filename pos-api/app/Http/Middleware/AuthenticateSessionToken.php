<?php

namespace App\Http\Middleware;

use App\Models\Session;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates API requests against the SAME session token better-auth (the
 * Next.js app) already issues on login — this API never sees a password or
 * mints its own tokens, it just reads the `session` table that both apps
 * share in the same Postgres database.
 */
class AuthenticateSessionToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Missing bearer token.'], 401);
        }

        $session = Session::with('user')->where('token', $token)->first();

        if (! $session || $session->expires_at->isPast()) {
            return response()->json(['message' => 'Session expired or invalid — please log in again.'], 401);
        }

        if (! $session->user || $session->user->status !== 'active') {
            return response()->json(['message' => 'Account is not active.'], 403);
        }

        // Same access rule as the web app's (app)/layout.tsx (src/lib/subscription.ts,
        // hasActiveAccess()) — checked here so it's enforced everywhere the PWA calls
        // in, not just once at login. The super role runs the platform rather than one
        // tenant, so it's exempt here exactly like it is on the web side.
        $business = $session->user->role !== 'super' ? $session->user->business : null;
        if ($business && ($business->status !== 'active' || ! $business->subscription_end || $business->subscription_end < now()->toDateString())) {
            return response()->json(['message' => 'Your subscription has ended. Renew from the Dashflow POS web dashboard to keep using the app.'], 402);
        }

        $request->attributes->set('authUser', $session->user);

        return $next($request);
    }
}
