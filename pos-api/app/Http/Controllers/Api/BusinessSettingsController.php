<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use Carbon\Carbon;
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

    /** Same catalog as the web app's lib/plans.ts — just the fields the Subscription card needs. */
    const PLAN_CATALOG = [
        'starter' => ['label' => 'Starter', 'tagline' => 'For very small shops just getting off the ground.', 'monthlyPrice' => 50000, 'maxUsers' => 1, 'maxBranches' => 1],
        'retail' => ['label' => 'Retail', 'tagline' => 'For shops that are growing and need a bit more room.', 'monthlyPrice' => 100000, 'maxUsers' => 3, 'maxBranches' => 1],
        'business' => ['label' => 'Business', 'tagline' => 'For wholesalers and medium businesses running real volume.', 'monthlyPrice' => 200000, 'maxUsers' => 10, 'maxBranches' => 3],
        'professional' => ['label' => 'Professional', 'tagline' => 'For larger, multi-branch businesses with staff to manage.', 'monthlyPrice' => 350000, 'maxUsers' => 25, 'maxBranches' => null],
        'enterprise' => ['label' => 'Enterprise', 'tagline' => 'For companies with complex, custom requirements.', 'monthlyPrice' => null, 'maxUsers' => null, 'maxBranches' => null],
    ];

    /** Same catalog as the web app's lib/modules.ts — just label + à-la-carte price. */
    const MODULE_CATALOG = [
        'pos' => ['label' => 'Point of Sale', 'monthlyPrice' => 50000],
        'inventory' => ['label' => 'Inventory Management', 'monthlyPrice' => 40000],
        'sales' => ['label' => 'Sales Management', 'monthlyPrice' => 40000],
        'accounting' => ['label' => 'Accounting', 'monthlyPrice' => 60000],
        'procurement' => ['label' => 'Procurement', 'monthlyPrice' => 40000],
        'customers' => ['label' => 'Customer Management', 'monthlyPrice' => 30000],
        'hr' => ['label' => 'Human Resources', 'monthlyPrice' => 50000],
        'attendance' => ['label' => 'Attendance', 'monthlyPrice' => 30000],
        'payroll' => ['label' => 'Payroll', 'monthlyPrice' => 50000],
    ];

    /**
     * The web app's Subscription card — plan (or à la carte modules), price, status,
     * dates and usage. Read-only for every role, matching the web app's settings page
     * (only admins can actually change the plan, from the web app's own /subscribe flow —
     * not ported here).
     */
    public function subscription(Request $request)
    {
        $businessId = $this->businessId($request);
        $business = Business::findOrFail($businessId);
        $activeModuleKeys = $this->activeModules($request);

        $plan = $business->plan_key ? (self::PLAN_CATALOG[$business->plan_key] ?? null) : null;

        if ($plan) {
            $price = $plan['monthlyPrice'] === null
                ? null
                : ($business->billing_period === 'annual' ? $plan['monthlyPrice'] * 10 : $plan['monthlyPrice']);
        } else {
            $price = array_sum(array_map(fn ($k) => self::MODULE_CATALOG[$k]['monthlyPrice'] ?? 0, $activeModuleKeys));
        }

        return response()->json([
            'planKey' => $business->plan_key,
            'planLabel' => $plan['label'] ?? null,
            'planTagline' => $plan['tagline'] ?? null,
            'billingPeriod' => $business->billing_period,
            'price' => $price,
            'isCustomPricing' => $plan && $plan['monthlyPrice'] === null,
            'status' => $business->subscription_status,
            'subscriptionStart' => $business->subscription_start ? Carbon::parse($business->subscription_start)->toDateString() : null,
            'subscriptionEnd' => $business->subscription_end ? Carbon::parse($business->subscription_end)->toDateString() : null,
            'modules' => array_values(array_map(fn ($k) => ['key' => $k, 'label' => self::MODULE_CATALOG[$k]['label'] ?? $k], $activeModuleKeys)),
            'usage' => [
                'userCount' => User::where('business_id', $businessId)->count(),
                'maxUsers' => $plan['maxUsers'] ?? null,
                'branchCount' => Branch::where('business_id', $businessId)->count(),
                'maxBranches' => $plan['maxBranches'] ?? null,
            ],
        ]);
    }

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
