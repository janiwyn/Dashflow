<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Debtor;
use App\Models\DebtorPayment;
use App\Services\LedgerEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DebtorController extends Controller
{
    use ScopesTenant;

    /** Sorted by balance, highest first — matches the web app's own default ordering. */
    public function index(Request $request)
    {
        $this->requireModule($request, 'customers');

        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $debtors = Debtor::with('branch')
            ->where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('balance')
            ->get();

        return response()->json($debtors->map(fn (Debtor $d) => $this->serialize($d)));
    }

    /** Manager and up — matches the web app's createDebtor gate. Branch is server-clamped to the caller's own branch, same as everywhere else. */
    public function store(Request $request)
    {
        $this->requireModule($request, 'customers');
        $businessId = $this->businessId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'item_taken' => ['nullable', 'string', 'max:255'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'balance' => ['required', 'numeric', 'min:0'],
            'branch_id' => ['nullable', 'integer'],
            'due_date' => ['nullable', 'date'],
        ]);

        if (trim($data['name']) === '') {
            throw ValidationException::withMessages(['name' => ['Debtor name is required.']]);
        }

        $branchId = $this->enforcedBranchId($request, $data['branch_id'] ?? null);
        if ($branchId) {
            $branchId = Branch::where('business_id', $businessId)->where('id', $branchId)->value('id');
        }

        $amountPaid = $data['amount_paid'] ?? 0;

        $debtor = Debtor::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'name' => trim($data['name']),
            'phone' => $data['phone'] ?? null,
            'item_taken' => $data['item_taken'] ?? null,
            'quantity' => $data['quantity'] ?? 0,
            'amount_paid' => $amountPaid,
            'balance' => $data['balance'],
            'due_date' => $data['due_date'] ?? null,
            'recorded_at' => now(),
        ]);

        // Goods handed over on credit — without this, Debtors Receivable only ever gets
        // credited by repayments and drifts permanently negative. Post the full value as
        // a credit sale, then immediately settle whatever portion was already paid.
        if (in_array('accounting', $this->activeModules($request), true)) {
            $user = $this->authUser($request);
            $totalValue = round((float) $data['balance'] + $amountPaid, 2);
            LedgerEngine::recordDebtExtended($businessId, $branchId, $totalValue, "Goods on credit — {$debtor->name}", $user->id, $user->name);
            if ($amountPaid > 0) {
                LedgerEngine::recordDebtorPayment($businessId, $branchId, $amountPaid, "Initial payment — {$debtor->name}", $user->id, $user->name);
            }
        }

        return response()->json(['message' => "{$debtor->name} added.", 'id' => $debtor->id], 201);
    }

    /**
     * Records a payment against a debtor's outstanding balance. Locks the debtor row for the
     * duration of the transaction before validating and writing the new balance — the web
     * app's own version reads balance, then writes it back as a separate statement (with only
     * the payment ledger's amount_paid using an atomic increment), a real lost-update race
     * under concurrent payments on the same debtor. Both balance and amount_paid are atomic here.
     */
    public function pay(Request $request, Debtor $debtor)
    {
        $this->requireModule($request, 'customers');

        if ($debtor->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $data = $request->validate(['amount' => ['required', 'numeric', 'min:0.01']]);
        $user = $this->authUser($request);

        $result = DB::transaction(function () use ($debtor, $data, $user) {
            $locked = Debtor::where('id', $debtor->id)->lockForUpdate()->first();

            if ($data['amount'] > (float) $locked->balance) {
                throw ValidationException::withMessages(['amount' => ["That's more than the outstanding balance — enter an amount up to what's owed."]]);
            }

            $newBalance = round((float) $locked->balance - $data['amount'], 2);

            DebtorPayment::create([
                'debtor_id' => $locked->id,
                'amount' => $data['amount'],
                'balance_after' => $newBalance,
                'recorded_by_id' => $user->id,
                'paid_at' => now(),
            ]);

            $locked->update([
                'balance' => $newBalance,
                'amount_paid' => round((float) $locked->amount_paid + $data['amount'], 2),
            ]);

            return $newBalance;
        });

        if (in_array('accounting', $this->activeModules($request), true)) {
            LedgerEngine::recordDebtorPayment($this->businessId($request), $debtor->branch_id, (float) $data['amount'], "Debt repayment — {$debtor->name}", $user->id, $user->name);
        }

        return response()->json([
            'message' => $result == 0 ? 'Debt fully paid off.' : 'Payment recorded.',
            'balance' => (float) $result,
        ]);
    }

    /** Any signed-in role can view history — matches the web app — but tenant-scoped here (the web app's equivalent has no business-id check on this read path). */
    public function payments(Request $request, Debtor $debtor)
    {
        $this->requireModule($request, 'customers');

        if ($debtor->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $payments = $debtor->payments()->orderByDesc('paid_at')->get();

        return response()->json($payments->map(fn (DebtorPayment $p) => [
            'amount' => (float) $p->amount,
            'balanceAfter' => (float) $p->balance_after,
            'paidAt' => $p->paid_at->toIso8601String(),
        ]));
    }

    /** Admin/super only — matches the web app. Deleting a debtor cascades their payment ledger away at the database level, same as the web app. */
    public function destroy(Request $request, Debtor $debtor)
    {
        $this->requireModule($request, 'customers');

        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin'], true)) {
            abort(403, 'Only admins can remove a debtor record.');
        }
        if ($debtor->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $name = $debtor->name;
        $debtor->delete();

        return response()->json(['message' => "{$name}'s debtor record removed."]);
    }

    private function serialize(Debtor $d): array
    {
        return [
            'id' => $d->id,
            'name' => $d->name,
            'phone' => $d->phone,
            'itemTaken' => $d->item_taken,
            'quantity' => $d->quantity,
            'branch' => $d->branch->name ?? 'Unassigned',
            'dueDate' => $d->due_date?->toDateString(),
            'balance' => (float) $d->balance,
            'amountPaid' => (float) $d->amount_paid,
        ];
    }
}
