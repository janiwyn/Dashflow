<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Business;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    use ScopesTenant;

    /** The catalog metadata lives here (not the DB) — same fixed list the Next.js app ships in src/lib/modules.ts. */
    const CATALOG = [
        'pos' => ['label' => 'Point of Sale', 'icon' => 'pos'],
        'inventory' => ['label' => 'Inventory', 'icon' => 'inventory'],
        'sales' => ['label' => 'Sales', 'icon' => 'sales'],
        'accounting' => ['label' => 'Accounting', 'icon' => 'accounting'],
        'procurement' => ['label' => 'Procurement', 'icon' => 'procurement'],
        'customers' => ['label' => 'Customers', 'icon' => 'customers'],
        'hr' => ['label' => 'HR', 'icon' => 'hr'],
        'attendance' => ['label' => 'Attendance', 'icon' => 'attendance'],
        'payroll' => ['label' => 'Payroll', 'icon' => 'payroll'],
    ];

    /**
     * Feeds the sidebar's gating: the active module set (already existed), plus the
     * business's package tier and real branch count. A "super" account has neither
     * (it runs the platform, not a business) — both come back null/false, matching
     * meetsPlanTier()'s own "always allow when there's no plan" rule.
     */
    public function index(Request $request)
    {
        $active = $this->activeModules($request);
        $user = $this->authUser($request);

        $planKey = null;
        $hasMultipleBranches = false;
        if ($user->role !== 'super') {
            $planKey = Business::where('id', $user->business_id)->value('plan_key');
            $hasMultipleBranches = Branch::where('business_id', $user->business_id)->count() > 1;
        }

        return response()->json([
            'active' => array_values($active),
            'catalog' => self::CATALOG,
            'planKey' => $planKey,
            'hasMultipleBranches' => $hasMultipleBranches,
        ]);
    }
}
