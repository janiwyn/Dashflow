<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Ports the web app's "/staff-dashboard" (sidebar label "Staff view"). Unlike
 * Manager view and Branch dashboard (both MANAGER_UP-gated), this is a
 * self-service "my shift today" page open to every role, including staff —
 * every query is scoped to the signed-in user's own cashier_id, not to a
 * branch. There's no branch dimension here in the web app either: "my sales"
 * is already narrower than any branch filter could make it, so nothing to
 * fix or leak.
 */
class StaffDashboardController extends Controller
{
    use ScopesTenant;

    public function index(Request $request)
    {
        $user = $this->authUser($request);
        $businessId = $user->business_id;

        $scope = fn () => Sale::where('business_id', $businessId)
            ->where('cashier_id', $user->id)
            ->where('status', '!=', 'refunded')
            ->whereDate('sold_at', now()->toDateString());

        $totals = (clone $scope())->selectRaw('coalesce(sum(total), 0) as revenue, count(*) as receipts')->first();
        $revenue = (float) $totals->revenue;
        $receipts = (int) $totals->receipts;
        $items = (int) DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.business_id', $businessId)
            ->where('sales.cashier_id', $user->id)
            ->where('sales.status', '!=', 'refunded')
            ->whereDate('sales.sold_at', now()->toDateString())
            ->sum('sale_items.quantity');

        $sales = (clone $scope())->withSum('items as items_qty', 'quantity')
            ->orderByDesc('sold_at')->limit(50)->get();

        return response()->json([
            'branchName' => $user->branch?->name,
            'stats' => ['revenue' => $revenue, 'receipts' => $receipts, 'items' => $items],
            'sales' => $sales->map(fn (Sale $s) => [
                'reference' => $s->reference, 'method' => $s->method,
                'items' => (int) ($s->items_qty ?? 0), 'total' => (float) $s->total,
                'soldAt' => $s->sold_at->toIso8601String(),
            ]),
        ]);
    }
}
