<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    use ScopesTenant;

    /**
     * Every money movement in the business — sales, purchases, expenses, supplier
     * payments, debtor repayments — one feed. Branch is shown as a column but (matching
     * the web app) not used to filter here — branch is not a first-class scope for
     * accounting the way it is for, say, sales.
     */
    public function index(Request $request)
    {
        $this->requireModule($request, 'accounting');

        $transactions = Transaction::with('branch')
            ->where('business_id', $this->businessId($request))
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        return response()->json($transactions->map(fn (Transaction $t) => $this->serialize($t)));
    }

    /**
     * Manager+ only. A real "add a transaction" form — the web app's own version of this
     * page has zero form/inputs at all despite having a fully-built, validated server
     * action behind it; nothing there ever calls it.
     */
    public function store(Request $request)
    {
        $this->requireModule($request, 'accounting');

        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can record a transaction.');
        }

        $data = $request->validate([
            'type' => ['required', 'in:income,expense'],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'entry_date' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'integer'],
        ]);

        if (trim($data['description']) === '') {
            throw ValidationException::withMessages(['description' => ['Description is required.']]);
        }

        $branchId = $this->enforcedBranchId($request, $data['branch_id'] ?? null);

        $transaction = Transaction::create([
            'business_id' => $this->businessId($request),
            'branch_id' => $branchId,
            'entry_date' => $data['entry_date'] ?? now()->toDateString(),
            'type' => $data['type'],
            'description' => trim($data['description']),
            'amount' => $data['amount'],
            'handled_by_id' => $user->id,
            'handled_by_name' => $user->name,
        ]);

        return response()->json(['message' => 'Transaction recorded.'] + $this->serialize($transaction), 201);
    }

    private function serialize(Transaction $t): array
    {
        return [
            'id' => $t->id,
            'type' => $t->type,
            'description' => $t->description,
            'branch' => $t->branch->name ?? null,
            'amount' => (float) $t->amount,
            'date' => $t->entry_date->toDateString(),
            'handledBy' => $t->handled_by_name,
        ];
    }
}
