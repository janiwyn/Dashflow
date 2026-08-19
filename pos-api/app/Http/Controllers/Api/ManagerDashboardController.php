<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;

/**
 * Ports the web app's "/manager-dashboard" (sidebar label "Manager view",
 * sits between Branch dashboard and Staff view there). Core feature, no
 * subscription module gate, manager+ only, purely read-only — the web app's
 * equivalent page has no mutating actions either, just four stat cards and a
 * recent-sales table.
 *
 * One fix, not a replication: the web app's "Expenses today" stat
 * (getExpenseTotals) filters only by businessId, with no branch filter at
 * all even though expenses has a branchId column — a branch-locked manager
 * sees the WHOLE business's expenses for the day, contradicting the card's
 * own "Across your branches" hint. Branch-scoped here, same fix pattern
 * already applied elsewhere this session (Branch Dashboard revenue chart,
 * notifications alerts, remote-order cancel).
 */
class ManagerDashboardController extends Controller
{
    use ScopesTenant;

    public function index(Request $request)
    {
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $salesToday = (float) Sale::where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'refunded')
            ->whereDate('sold_at', now()->toDateString())
            ->sum('total');

        $expensesToday = (float) Expense::where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereDate('incurred_on', now()->toDateString())
            ->sum('amount');

        $productsScope = Product::where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $totalStaff = Employee::where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'active')
            ->count();

        return response()->json([
            'branchName' => $branchId ? Branch::find($branchId)?->name : null,
            'salesToday' => $salesToday,
            'expensesToday' => $expensesToday,
            'productCount' => (clone $productsScope)->count(),
            'lowStock' => (clone $productsScope)->lowStock()->count(),
            'totalStaff' => $totalStaff,
        ]);
    }

    private function requireManagerUp(Request $request): void
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can view the manager dashboard.');
        }
    }
}
