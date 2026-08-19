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

        $request->attributes->set('authUser', $session->user);

        return $next($request);
    }
}
