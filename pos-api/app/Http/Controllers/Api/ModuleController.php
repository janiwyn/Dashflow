<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
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

    public function index(Request $request)
    {
        $active = $this->activeModules($request);

        return response()->json([
            'active' => array_values($active),
            'catalog' => self::CATALOG,
        ]);
    }
}
