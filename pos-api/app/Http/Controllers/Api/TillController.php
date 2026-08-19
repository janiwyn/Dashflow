<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Till;
use App\Models\TillRemoval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TillController extends Controller
{
    use ScopesTenant;

    public function index(Request $request)
    {
        $this->requireModule($request, 'pos');
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $tills = Till::with('branch')
            ->where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->get();

        return response()->json($tills->map(fn (Till $t) => [
            'id' => $t->id,
            'name' => $t->name,
            'branch' => $t->branch->name ?? 'Unassigned',
            'branchId' => $t->branch_id,
            'staff' => $t->staff_name ?? 'Unassigned',
            'phone' => $t->phone,
            'balance' => $t->balance,
            'created' => $t->created_at->toIso8601String(),
        ]));
    }

    /** Creating a till assigns a real employee, not a free-text name — mirrors how the rest of the app attributes staff actions. */
    public function store(Request $request)
    {
        $this->requireModule($request, 'pos');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'branch_id' => ['nullable', 'integer'],
            'employee_id' => ['nullable', 'integer'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $branchId = $this->enforcedBranchId($request, $data['branch_id'] ?? null);
        $businessId = $this->businessId($request);

        $staffId = null;
        $staffName = null;
        if (! empty($data['employee_id'])) {
            $employee = Employee::where('business_id', $businessId)->where('id', $data['employee_id'])->first();
            if (! $employee) {
                throw ValidationException::withMessages(['employee_id' => ['Selected staff member not found.']]);
            }
            $staffId = $employee->user_id;
            $staffName = $employee->name;
        }

        $till = Till::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'name' => trim($data['name']),
            'staff_id' => $staffId,
            'staff_name' => $staffName,
            'phone' => trim($data['phone'] ?? '') ?: null,
            'balance' => 0,
        ]);

        return response()->json(['id' => $till->id, 'message' => "Till \"{$till->name}\" created."], 201);
    }

    public function removals(Request $request)
    {
        $this->requireModule($request, 'pos');
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $removals = TillRemoval::with('till')
            ->whereHas('till', function ($q) use ($request, $branchId) {
                $q->where('business_id', $this->businessId($request));
                if ($branchId) {
                    $q->where('branch_id', $branchId);
                }
            })
            ->orderByDesc('removed_at')
            ->limit(100)
            ->get();

        return response()->json($removals->map(fn (TillRemoval $r) => [
            'id' => $r->id,
            'till' => $r->till->name ?? '—',
            'amount' => $r->amount,
            'approvedBy' => $r->approved_by_name,
            'balanceAfter' => $r->balance_after,
            'date' => $r->removed_at->toIso8601String(),
        ]));
    }

    /** Cash to the safe — validated against the till's real balance, unlike the web app's version of this form which never touched the database at all. */
    public function removeCash(Request $request)
    {
        $this->requireModule($request, 'pos');

        $data = $request->validate([
            'till_id' => ['required', 'integer'],
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $user = $this->authUser($request);
        $till = Till::where('business_id', $this->businessId($request))->where('id', $data['till_id'])->first();

        if (! $till) {
            throw ValidationException::withMessages(['till_id' => ['Till not found.']]);
        }
        if ($data['amount'] > (float) $till->balance) {
            throw ValidationException::withMessages(['amount' => ['Amount exceeds the till\'s current balance.']]);
        }

        DB::transaction(function () use ($till, $data, $user) {
            $newBalance = round((float) $till->balance - $data['amount'], 2);

            TillRemoval::create([
                'till_id' => $till->id,
                'amount' => $data['amount'],
                'approved_by_name' => $user->name,
                'balance_after' => $newBalance,
                'removed_at' => now(),
            ]);

            $till->update(['balance' => $newBalance]);
        });

        return response()->json(['message' => 'Till removal recorded successfully.']);
    }
}
