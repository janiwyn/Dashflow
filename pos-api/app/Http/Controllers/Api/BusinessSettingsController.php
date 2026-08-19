<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

/**
 * Ports the web app's "/settings" (business profile + currency), distinct
 * from the personal "/profile" page — admin/super only there (requireRole),
 * matched here. Same field set: name, tagline, phone, address, tax PIN,
 * currency. The web app also has a Bluetooth receipt-printer pairing panel
 * on this page — that's a browser-local Web Bluetooth feature with no
 * server-side state at all, left out of this pass as a separate, much
 * larger piece of work.
 */
class BusinessSettingsController extends Controller
{
    use ScopesTenant;

    /** Same list, same order, as the web app's SUPPORTED_CURRENCIES (lib/currency.ts). */
    const SUPPORTED_CURRENCIES = [
        ['code' => 'KES', 'name' => 'Kenyan Shilling', 'symbol' => 'KSh'],
        ['code' => 'UGX', 'name' => 'Ugandan Shilling', 'symbol' => 'USh'],
        ['code' => 'TZS', 'name' => 'Tanzanian Shilling', 'symbol' => 'TSh'],
        ['code' => 'RWF', 'name' => 'Rwandan Franc', 'symbol' => 'FRw'],
        ['code' => 'NGN', 'name' => 'Nigerian Naira', 'symbol' => '₦'],
        ['code' => 'GHS', 'name' => 'Ghanaian Cedi', 'symbol' => 'GH₵'],
        ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$'],
        ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£'],
        ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
    ];

    public function show(Request $request)
    {
        $this->requireAdminUp($request);
        $business = Business::findOrFail($this->businessId($request));

        return response()->json([
            'name' => $business->name,
            'tagline' => $business->tagline ?? '',
            'phone' => $business->phone ?? '',
            'address' => $business->address ?? '',
            'taxPin' => $business->tax_pin ?? '',
            'currency' => $business->currency,
            'currencies' => self::SUPPORTED_CURRENCIES,
        ]);
    }

    public function update(Request $request)
    {
        $this->requireAdminUp($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'tax_pin' => ['nullable', 'string', 'max:100'],
            'currency' => ['required', 'string'],
        ]);

        if (! in_array($data['currency'], array_column(self::SUPPORTED_CURRENCIES, 'code'), true)) {
            return response()->json(['message' => 'Unsupported currency.'], 422);
        }

        $business = Business::findOrFail($this->businessId($request));
        $business->update([
            'name' => trim($data['name']),
            'tagline' => $this->cleaned($data['tagline'] ?? null),
            'phone' => $this->cleaned($data['phone'] ?? null),
            'address' => $this->cleaned($data['address'] ?? null),
            'tax_pin' => $this->cleaned($data['tax_pin'] ?? null),
            'currency' => $data['currency'],
        ]);

        return response()->json(['message' => 'Settings updated successfully!']);
    }

    private function cleaned(?string $value): ?string
    {
        $trimmed = trim($value ?? '');

        return $trimmed !== '' ? $trimmed : null;
    }

    private function requireAdminUp(Request $request): void
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin'], true)) {
            abort(403, 'Only admins can manage business settings.');
        }
    }
}
