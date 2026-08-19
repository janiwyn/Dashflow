<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Supplier;
use App\Services\LedgerEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierController extends Controller
{
    use ScopesTenant;

    /** Highest-debt suppliers first — mirrors the web app's own default ordering. */
    public function index(Request $request)
    {
        $this->requireModule($request, 'procurement');

        $suppliers = Supplier::with('category')
            ->where('business_id', $this->businessId($request))
            ->orderByDesc('payable')
            ->get();

        return response()->json($suppliers->map(fn (Supplier $s) => $this->serialize($s)));
    }

    public function store(Request $request)
    {
        $this->requireModule($request, 'procurement');
        $businessId = $this->businessId($request);

        $data = $this->validated($request);
        $categoryId = $this->resolveCategoryId($businessId, $data['category_id'] ?? null);

        $supplier = Supplier::create([
            'business_id' => $businessId,
            'name' => trim($data['name']),
            'category_id' => $categoryId,
            'contact' => $data['contact'] ?? null,
            'contact_person' => $data['contact_person'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'payment_terms' => $data['payment_terms'] ?? null,
        ]);

        return response()->json(['message' => "{$supplier->name} added.", 'id' => $supplier->id] + $this->serialize($supplier->load('category')), 201);
    }

    /** Manager and up — matches the web app's createSupplier/updateSupplier gate. */
    public function update(Request $request, Supplier $supplier)
    {
        $this->requireModule($request, 'procurement');
        $businessId = $this->businessId($request);

        if ($supplier->business_id !== $businessId) {
            abort(404);
        }

        $data = $this->validated($request);
        $updates = [
            'name' => trim($data['name']),
            'contact' => $data['contact'] ?? null,
            'contact_person' => $data['contact_person'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'payment_terms' => $data['payment_terms'] ?? null,
        ];
        if (array_key_exists('category_id', $data)) {
            $updates['category_id'] = $this->resolveCategoryId($businessId, $data['category_id']);
        }

        $supplier->update($updates);

        return response()->json(['message' => 'Supplier updated.'] + $this->serialize($supplier->fresh('category')));
    }

    /** Admin/super only — the web app excludes manager from delete, unlike create/update. */
    public function destroy(Request $request, Supplier $supplier)
    {
        $this->requireModule($request, 'procurement');

        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin'], true)) {
            abort(403, 'Only admins can remove a supplier.');
        }
        if ($supplier->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $name = $supplier->name;
        $supplier->delete();

        return response()->json(['message' => "{$name} removed."]);
    }

    /**
     * Locks the supplier row for the duration of the transaction before validating and
     * writing the new balance — the web app's own version reads then writes payable as a
     * plain literal, which is a real (if narrow) lost-update race under concurrent payments.
     */
    public function pay(Request $request, Supplier $supplier)
    {
        $this->requireModule($request, 'procurement');

        if ($supplier->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:cash,bank'],
        ]);

        $message = DB::transaction(function () use ($supplier, $data) {
            $locked = Supplier::where('id', $supplier->id)->lockForUpdate()->first();

            if ($data['amount'] > (float) $locked->payable) {
                throw ValidationException::withMessages(['amount' => ["That's more than what's owed to this supplier."]]);
            }

            $locked->update(['payable' => round((float) $locked->payable - $data['amount'], 2)]);

            return "Payment recorded for {$locked->name}.";
        });

        if (in_array('accounting', $this->activeModules($request), true)) {
            $user = $this->authUser($request);
            LedgerEngine::recordSupplierPayment($this->businessId($request), null, (float) $data['amount'], "Payment to {$supplier->name}", $user->id, $user->name);
        }

        return response()->json(['message' => $message]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['sometimes', 'nullable', 'integer'],
            'contact' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'payment_terms' => ['nullable', 'string', 'max:255'],
        ]);
    }

    private function resolveCategoryId(int $businessId, ?int $categoryId): ?int
    {
        if (! $categoryId) {
            return null;
        }

        return Category::where('business_id', $businessId)->where('id', $categoryId)->value('id');
    }

    private function serialize(Supplier $s): array
    {
        return [
            'id' => $s->id,
            'name' => $s->name,
            'category' => $s->category->name ?? 'General',
            'categoryId' => $s->category_id,
            'contact' => $s->contact,
            'contactPerson' => $s->contact_person,
            'email' => $s->email,
            'address' => $s->address,
            'paymentTerms' => $s->payment_terms,
            'lastDelivery' => $s->last_delivery?->toDateString(),
            'payable' => (float) $s->payable,
        ];
    }
}
