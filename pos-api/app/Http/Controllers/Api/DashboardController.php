<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Customer;
use App\Models\RemoteOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ScopesTenant;

    public function index(Request $request)
    {
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);
        $business = Business::findOrFail($businessId);
        $user = $this->authUser($request);
        $branch = $branchId ? Branch::find($branchId) : null;

        // Combined into one round-trip via FILTER clauses — Neon's ~550ms-per-query network
        // latency from this machine means four separate sum()/count() calls here cost ~2.2s
        // that one query avoids entirely.
        $todayStart = now()->startOfDay();
        $yesterdayStart = now()->subDay()->startOfDay();
        $weekStart = now()->subDays(6)->startOfDay();

        $salesTotals = DB::table('sales')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'refunded')
            ->selectRaw(
                'coalesce(sum(total) filter (where sold_at >= ?), 0) as today_revenue,
                 count(*) filter (where sold_at >= ?) as today_receipts,
                 coalesce(sum(total) filter (where sold_at >= ? and sold_at < ?), 0) as yesterday_revenue,
                 coalesce(sum(total) filter (where sold_at >= ?), 0) as week_revenue',
                [$todayStart, $todayStart, $yesterdayStart, $todayStart, $weekStart],
            )
            ->first();

        $todayRevenue = (float) $salesTotals->today_revenue;
        $todayReceipts = (int) $salesTotals->today_receipts;
        $yesterdayRevenue = (float) $salesTotals->yesterday_revenue;
        $weekRevenue = (float) $salesTotals->week_revenue;

        $productTotals = DB::table('products')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->selectRaw('count(*) filter (where stock <= low_stock_threshold) as low_stock_count, coalesce(sum(buying_price * stock), 0) as stock_value')
            ->first();

        $lowStockCount = (int) $productTotals->low_stock_count;
        $stockValue = (float) $productTotals->stock_value;

        $pendingOrdersCount = RemoteOrder::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'pending')
            ->count();

        $customerCount = Customer::where('business_id', $businessId)->count();

        $series = DB::table('sales')
            ->selectRaw("to_char(sold_at, 'YYYY-MM-DD') as date, to_char(sold_at, 'Dy') as day, coalesce(sum(total), 0) as revenue")
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('sold_at', '>=', now()->subDays(6)->startOfDay())
            ->where('status', '!=', 'refunded')
            ->groupBy('date', 'day')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['day' => $r->day, 'revenue' => (float) $r->revenue]);

        return response()->json([
            'business' => ['name' => $business->name, 'currency' => $business->currency],
            'user' => ['name' => $user->name, 'role' => $user->role, 'theme' => $user->theme ?? 'light'],
            'branchLocked' => $user->isBranchLocked(),
            'selectedBranchId' => $branchId,
            'branchName' => $branch?->name,
            'today' => [
                'salesTotal' => $todayRevenue,
                'salesCount' => $todayReceipts,
                'averageBasket' => $todayReceipts ? round($todayRevenue / $todayReceipts) : 0,
                'revenueDeltaPct' => $yesterdayRevenue > 0 ? round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100) : null,
            ],
            'weekRevenue' => $weekRevenue,
            'revenueSeries' => $series,
            'stockValue' => $stockValue,
            'lowStockCount' => $lowStockCount,
            'pendingOrdersCount' => $pendingOrdersCount,
            'customerCount' => $customerCount,
        ]);
    }
}
