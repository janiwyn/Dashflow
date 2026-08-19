<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Services\LedgerEngine;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use ScopesTenant;

    public function index(Request $request)
    {
        $this->requireModule($request, 'accounting');

        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $expenses = Expense::where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('incurred_on')
            ->orderByDesc('id')
            ->limit(30)
            ->get();

        return response()->json($expenses->map(fn (Expense $e) => [
            'id' => $e->id,
            'reference' => $e->reference,
            'label' => $e->label,
            'category' => $e->category,
            'amount' => $e->amount,
            'incurredOn' => $e->incurred_on->toDateString(),
        ]));
    }

    /** Record an expense on the spot — fuel, a delivery tip, restocking cash — the phone-native reason this module matters here. */
    public function store(Request $request)
    {
        $this->requireModule($request, 'accounting');

        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);
        $user = $this->authUser($request);

        $businessId = $this->businessId($request);

        $expense = Expense::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'reference' => 'EXP-'.strtoupper(base_convert((string) now()->getPreciseTimestamp(3), 10, 36)),
            'label' => $data['label'],
            'category' => $data['category'],
            'amount' => $data['amount'],
            'incurred_on' => now()->toDateString(),
            'handled_by_id' => $user->id,
        ]);

        // The web app posts this unconditionally regardless of whether the business has the
        // accounting module active — every other auto-posting trigger checks first, so this
        // normalizes expenses to match rather than replicate the inconsistency.
        if (in_array('accounting', $this->activeModules($request), true)) {
            LedgerEngine::recordExpense($businessId, $branchId, $data['category'], (float) $data['amount'], "{$data['label']} ({$expense->reference})", $user->id, $user->name);
        }

        return response()->json(['id' => $expense->id, 'reference' => $expense->reference], 201);
    }
}
