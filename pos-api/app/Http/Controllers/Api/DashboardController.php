<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Product;
use App\Models\RemoteOrder;
use App\Models\Sale;
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

        $salesScope = fn () => Sale::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'refunded');

        $todayRevenue = (float) (clone $salesScope())->whereDate('sold_at', now()->toDateString())->sum('total');
        $todayReceipts = (clone $salesScope())->whereDate('sold_at', now()->toDateString())->count();
        $yesterdayRevenue = (float) (clone $salesScope())->whereDate('sold_at', now()->subDay()->toDateString())->sum('total');
        $weekRevenue = (float) (clone $salesScope())->where('sold_at', '>=', now()->subDays(6)->startOfDay())->sum('total');

        $productsScope = fn () => Product::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $lowStockCount = (clone $productsScope())->lowStock()->count();
        $stockValue = (float) (clone $productsScope())->selectRaw('coalesce(sum(buying_price * stock), 0) as v')->value('v');

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
            'user' => ['name' => $user->name, 'role' => $user->role],
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
