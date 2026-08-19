<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    use ScopesTenant;

    /**
     * Customers aren't branch-scoped in the web app (a customer is visible business-wide,
     * unlike almost every other list here) — deliberately not applying enforcedBranchId.
     * Ordered by outstanding balance, highest first, matching the web app's own query.
     */
    public function index(Request $request)
    {
        $this->requireModule($request, 'customers');

        $customers = Customer::withCount('sales as orders')
            ->withSum(['sales as spend' => fn ($q) => $q->where('status', '!=', 'refunded')], 'total')
            ->where('business_id', $this->businessId($request))
            ->orderByDesc('account_balance')
            ->get();

        return response()->json($customers->map(fn (Customer $c) => [
            'id' => $c->id,
            'name' => $c->name,
            'type' => $c->type,
            'contact' => $c->contact,
            'orders' => (int) $c->orders,
            'spend' => (float) ($c->spend ?? 0),
            'balance' => (float) $c->account_balance,
        ]));
    }

    public function store(Request $request)
    {
        $this->requireModule($request, 'customers');

        $data = $this->validated($request);

        $customer = Customer::create([
            'business_id' => $this->businessId($request),
            'name' => trim($data['name']),
            'type' => $data['type'] ?? 'retail',
            'contact' => $data['contact'] ?? null,
            'email' => $data['email'] ?? null,
            'preferred_payment_method' => $data['preferred_payment_method'] ?? null,
        ]);

        return response()->json(['message' => "{$customer->name} added.", 'id' => $customer->id], 201);
    }

    public function update(Request $request, Customer $customer)
    {
        $this->requireModule($request, 'customers');

        if ($customer->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $data = $this->validated($request);

        $customer->update([
            'name' => trim($data['name']),
            'type' => $data['type'] ?? $customer->type,
            'contact' => $data['contact'] ?? null,
            'email' => $data['email'] ?? null,
            'preferred_payment_method' => $data['preferred_payment_method'] ?? null,
        ]);

        return response()->json(['message' => 'Customer updated.']);
    }

    /** Admin/super only — the web app excludes manager from delete, same as Suppliers. Past sales keep their customerName snapshot either way. */
    public function destroy(Request $request, Customer $customer)
    {
        $this->requireModule($request, 'customers');

        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin'], true)) {
            abort(403, 'Only admins can remove a customer.');
        }
        if ($customer->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $name = $customer->name;
        $customer->delete();

        return response()->json(['message' => "{$name} removed."]);
    }

    /**
     * Account balance and amount credited are static in the web app too — nothing anywhere
     * (there or here) ever writes to them after creation, so they simply reflect whatever
     * was seeded. Not replicating a "record payment" flow here since the real app has none
     * for customers (that's a separate, unrelated feature — Debtors — already built).
     */
    public function file(Request $request, Customer $customer)
    {
        $this->requireModule($request, 'customers');

        if ($customer->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $sales = Sale::with(['items', 'branch'])
            ->where('customer_id', $customer->id)
            ->orderByDesc('sold_at')
            ->limit(25)
            ->get();

        return response()->json([
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'type' => $customer->type,
                'contact' => $customer->contact,
                'email' => $customer->email,
                'paymentMethod' => $customer->preferred_payment_method,
                'openingDate' => $customer->opening_date?->toDateString(),
                'accountBalance' => (float) $customer->account_balance,
                'amountCredited' => (float) $customer->amount_credited,
            ],
            'transactions' => $sales->map(fn (Sale $s) => [
                'date' => $s->sold_at->toIso8601String(),
                'branch' => $s->branch->name ?? null,
                'ref' => $s->reference,
                'products' => $s->items->map(fn ($i) => "{$i->name} x{$i->quantity}")->join(', ') ?: null,
                'paid' => (float) $s->amount_paid,
                'balanceDue' => max((float) $s->total - (float) $s->amount_paid, 0),
                'status' => $s->status === 'paid' ? 'paid' : 'pending',
            ]),
        ]);
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'in:retail,wholesale'],
            'contact' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'string', 'max:255'],
            'preferred_payment_method' => ['nullable', 'string', 'max:255'],
        ]);

        if (trim($data['name']) === '') {
            throw ValidationException::withMessages(['name' => ['Customer name is required.']]);
        }

        return $data;
    }
}
