<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Debtor;
use App\Models\Notification;
use App\Models\Product;
use App\Models\RemoteOrder;
use Illuminate\Http\Request;

/**
 * Ports the web app's "/notifications" — a core, always-on feature (no
 * subscription module gate there, matched here). Every alert is computed
 * live from products/debtors/customers on each request, exactly like the
 * web app; the `notifications` table itself only ever stores dismiss/snooze
 * suppressions, never real "unread" rows — the schema's is_read column is
 * always written true, there's no create-on-event trigger anywhere.
 *
 * Two real, intentional deviations from the web app:
 *  - Every alert query here is properly branch-scoped. The web app's four
 *    equivalent queries filter by businessId only, so a branch-locked
 *    manager sees (and could dismiss) every other branch's low-stock and
 *    debtor alerts — closed here via enforcedBranchId(), same fix already
 *    applied to the Branch Dashboard's revenue chart and remote-order cancel.
 *  - count() backs a real unread badge. The web app's header bell is a
 *    hardcoded red dot with no query behind it at all — always shown,
 *    regardless of whether there's anything to see.
 */
class NotificationController extends Controller
{
    use ScopesTenant;

    const KINDS = ['low_stock', 'shop_debtor', 'customer_debtor'];

    public function index(Request $request)
    {
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        return response()->json([
            'shopDebtors' => $this->shopDebtorAlerts($businessId, $branchId),
            'customerDebtors' => $this->customerDebtorAlerts($businessId),
            'lowStock' => $this->lowStockAlerts($businessId, $branchId),
        ]);
    }

    /** Feeds the sidebar badge — a real count, unlike the web app's static dot. */
    public function count(Request $request)
    {
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $alerts = $this->lowStockAlerts($businessId, $branchId)->count()
            + $this->shopDebtorAlerts($businessId, $branchId)->count()
            + $this->customerDebtorAlerts($businessId)->count();

        $orderAlerts = 0;
        if (in_array('sales', $this->activeModules($request), true)) {
            $orderAlerts = RemoteOrder::where('business_id', $businessId)
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->where('status', 'pending')->count();
        }

        return response()->json(['alerts' => $alerts, 'orderAlerts' => $orderAlerts, 'total' => $alerts + $orderAlerts]);
    }

    public function dismiss(Request $request)
    {
        $data = $this->validateSuppression($request);
        $this->suppress($request, $data, null);

        return response()->json(['message' => 'Alert dismissed.']);
    }

    public function snooze(Request $request)
    {
        $data = $this->validateSuppression($request);
        $this->suppress($request, $data, now()->addDay());

        return response()->json(['message' => 'Alert snoozed for 24 hours.']);
    }

    private function validateSuppression(Request $request): array
    {
        return $request->validate([
            'kind' => ['required', 'in:'.implode(',', self::KINDS)],
            'reference_id' => ['required', 'integer'],
            'title' => ['required', 'string', 'max:255'],
        ]);
    }

    private function suppress(Request $request, array $data, $dueDate): void
    {
        $businessId = $this->businessId($request);

        Notification::updateOrCreate(
            ['business_id' => $businessId, 'kind' => $data['kind'], 'reference_id' => $data['reference_id']],
            ['branch_id' => $this->enforcedBranchId($request), 'title' => $data['title'], 'is_read' => true, 'due_date' => $dueDate, 'created_at' => now()]
        );
    }

    /** Fields match the web app's viewLowStockNotifs() exactly: id/name/branch/stock/price (selling price). */
    private function lowStockAlerts(int $businessId, ?int $branchId)
    {
        return Product::with('branch')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->lowStock()
            ->whereNotIn('id', $this->suppressedIds($businessId, 'low_stock'))
            ->orderBy('stock')
            ->limit(50)->get()
            ->map(fn (Product $p) => [
                'id' => $p->id, 'name' => $p->name, 'branch' => $p->branch->name ?? 'Unassigned',
                'stock' => $p->stock, 'price' => (float) $p->selling_price,
            ])->values();
    }

    /** Fields match the web app's viewShopDebtorNotifs() exactly: id/name/branch/dueDate/balance. */
    private function shopDebtorAlerts(int $businessId, ?int $branchId)
    {
        return Debtor::with('branch')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('balance', '>', 0)
            ->whereNotIn('id', $this->suppressedIds($businessId, 'shop_debtor'))
            ->orderBy('due_date')
            ->limit(50)->get()
            ->map(fn (Debtor $d) => [
                'id' => $d->id, 'name' => $d->name, 'branch' => $d->branch->name ?? 'Unassigned',
                'dueDate' => optional($d->due_date)->toIso8601String(), 'balance' => (float) $d->balance,
            ])->values();
    }

    /**
     * Fields match the web app's viewCustomerDebtorNotifs() exactly: id/name/dueDate/balance
     * — "dueDate" here is really the customer's opening_date, same quirky reuse the web app
     * itself does (customers have no due-date column of their own). No branch filter, same
     * reason as the count() customer branch (customers aren't branch-scoped entities here).
     */
    private function customerDebtorAlerts(int $businessId)
    {
        return Customer::where('business_id', $businessId)
            ->where('account_balance', '>', 0)
            ->whereNotIn('id', $this->suppressedIds($businessId, 'customer_debtor'))
            ->orderByDesc('account_balance')
            ->limit(50)->get()
            ->map(fn (Customer $c) => [
                'id' => $c->id, 'name' => $c->name,
                'dueDate' => optional($c->opening_date)->toIso8601String(), 'balance' => (float) $c->account_balance,
            ])->values();
    }

    private function suppressedIds(int $businessId, string $kind): array
    {
        return Notification::where('business_id', $businessId)
            ->where('kind', $kind)
            ->where('is_read', true)
            ->where(fn ($q) => $q->whereNull('due_date')->orWhere('due_date', '>', now()))
            ->pluck('reference_id')->filter()->all();
    }
}
