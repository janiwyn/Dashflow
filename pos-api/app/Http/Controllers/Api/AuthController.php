<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

/**
 * Credentials are never checked here. better-auth (the Next.js app) owns
 * password hashing and verification; this controller just forwards the
 * login attempt to it and hands back the same session token, so the PWA
 * only ever has to talk to this one API.
 */
class AuthController extends Controller
{
    use ScopesTenant;

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $response = Http::acceptJson()
            ->post(rtrim(config('services.dashflow_web.url'), '/').'/api/auth/sign-in/email', [
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

        if ($response->failed()) {
            $message = $response->json('message') ?? 'Invalid email or password.';
            throw ValidationException::withMessages(['email' => [$message]]);
        }

        $token = $response->json('token');
        $user = $response->json('user');

        if (! $token || ! $user) {
            return response()->json(['message' => 'Login did not return a session.'], 502);
        }

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'] ?? null,
                'businessId' => $user['businessId'] ?? null,
                'branchId' => $user['branchId'] ?? null,
            ],
        ]);
    }

    /**
     * Creates a brand-new business and its owner account. Mirrors the web
     * app's public signup flow exactly, just split across two hops: better-auth
     * creates the `user` row (same as login, no password logic here either),
     * then the Next.js app's own /api/mobile/business-signup route — backed by
     * the exact same completeBusinessSignup() function the web signup form
     * calls — creates the business and attaches it to the new user.
     */
    public function signup(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email'],
            'phone' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:8'],
            'business_name' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'in:admin,manager'],
        ]);

        $webUrl = rtrim(config('services.dashflow_web.url'), '/');

        $signUpResponse = Http::acceptJson()->post($webUrl.'/api/auth/sign-up/email', [
            'email' => $data['email'],
            'password' => $data['password'],
            'name' => $data['username'],
            'username' => $data['username'],
            'phone' => $data['phone'],
        ]);

        if ($signUpResponse->failed()) {
            $message = $signUpResponse->json('message') ?? 'Could not create the account.';
            throw ValidationException::withMessages(['email' => [$message]]);
        }

        $token = $signUpResponse->json('token');
        $user = $signUpResponse->json('user');

        if (! $token || ! $user) {
            return response()->json(['message' => 'Sign-up did not return a session.'], 502);
        }

        $businessResponse = Http::acceptJson()
            ->withToken($token)
            ->post($webUrl.'/api/mobile/business-signup', [
                'businessName' => $data['business_name'],
                'role' => $data['role'] ?? 'admin',
                'moduleKeys' => [],
            ]);

        if ($businessResponse->failed()) {
            $message = $businessResponse->json('message') ?? 'Could not set up the business.';
            throw ValidationException::withMessages(['business_name' => [$message]]);
        }

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $data['role'] ?? 'admin',
                'businessId' => $businessResponse->json('businessId'),
                'branchId' => null,
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $this->authUser($request);
        $employee = Employee::where('business_id', $user->business_id)->where('user_id', $user->id)->first();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'position' => $employee?->position,
            'hireDate' => $employee?->hire_date?->toDateString(),
            'businessId' => $user->business_id,
            'branchId' => $user->branch_id,
            'businessName' => optional($user->business)->name,
            'branchName' => optional($user->branch)->name,
        ]);
    }

    /** Only name and phone are self-editable — email is the auth identity, and role/business/branch are privilege fields set elsewhere. */
    public function updateMe(Request $request)
    {
        $user = $this->authUser($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $user->update($data);

        return response()->json(['message' => 'Profile updated.']);
    }
}
