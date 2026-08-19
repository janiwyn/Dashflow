<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Services\LedgerEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderController extends Controller
{
    use ScopesTenant;

    public function index(Request $request)
    {
        $this->requireModule($request, 'procurement');

        $orders = PurchaseOrder::with(['supplier', 'items'])
            ->where('business_id', $this->businessId($request))
            ->orderByDesc('ordered_at')
            ->limit(50)
            ->get();

        return response()->json($orders->map(fn (PurchaseOrder $o) => $this->serialize($o)));
    }

    public function items(Request $request, PurchaseOrder $purchaseOrder)
    {
        $this->requireModule($request, 'procurement');

        if ($purchaseOrder->business_id !== $this->businessId($request)) {
            abort(404);
        }

        return response()->json($purchaseOrder->items->map(fn (PurchaseOrderItem $i) => [
            'name' => $i->product_name,
            'qty' => $i->quantity,
            'unitCost' => (float) $i->unit_cost,
            'subtotal' => (float) $i->subtotal,
        ]));
    }

    /** Server re-verifies everything the client sends — quantities, costs and product names are never trusted. */
    public function store(Request $request)
    {
        $this->requireModule($request, 'procurement');
        $businessId = $this->businessId($request);

        $data = $request->validate([
            'supplier_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer'],
            'items.*.unit_cost' => ['required', 'numeric'],
        ]);

        $lines = collect($data['items'])->filter(fn ($l) => $l['quantity'] > 0)->values();
        if ($lines->isEmpty()) {
            throw ValidationException::withMessages(['items' => ['Add at least one item with a quantity greater than zero.']]);
        }
        if ($lines->contains(fn ($l) => $l['unit_cost'] < 0)) {
            throw ValidationException::withMessages(['items' => ["Unit cost can't be negative."]]);
        }

        $supplierId = null;
        if (! empty($data['supplier_id'])) {
            $supplierId = Supplier::where('business_id', $businessId)->where('id', $data['supplier_id'])->value('id');
            if (! $supplierId) {
                throw ValidationException::withMessages(['supplier_id' => ['Supplier not found.']]);
            }
        }

        $products = Product::where('business_id', $businessId)->whereIn('id', $lines->pluck('product_id'))->get()->keyBy('id');
        foreach ($lines as $line) {
            if (! $products->has($line['product_id'])) {
                throw ValidationException::withMessages(['items' => ['One of the selected products no longer exists.']]);
            }
        }

        $order = DB::transaction(function () use ($lines, $products, $businessId, $supplierId, $data, $request) {
            $totalCost = $lines->sum(fn ($l) => $l['quantity'] * $l['unit_cost']);

            $order = PurchaseOrder::create([
                'business_id' => $businessId,
                'supplier_id' => $supplierId,
                'reference' => 'PO-'.strtoupper(base_convert((string) now()->getPreciseTimestamp(3), 10, 36)),
                'status' => 'pending',
                'notes' => trim($data['notes'] ?? '') ?: null,
                'total_cost' => $totalCost,
                'ordered_at' => now(),
                'created_by' => $this->authUser($request)->id,
            ]);

            foreach ($lines as $line) {
                $product = $products->get($line['product_id']);
                PurchaseOrderItem::create([
                    'purchase_order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $line['quantity'],
                    'unit_cost' => $line['unit_cost'],
                    'subtotal' => $line['quantity'] * $line['unit_cost'],
                ]);
            }

            return $order;
        });

        return response()->json(['message' => "Purchase order {$order->reference} created.", 'reference' => $order->reference], 201);
    }

    /**
     * Bumps real stock for every line item, and — only when paid on credit — adds the
     * order's total to the supplier's payable balance. Cash/bank receipts never touch payable.
     */
    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        $this->requireModule($request, 'procurement');
        $businessId = $this->businessId($request);

        if ($purchaseOrder->business_id !== $businessId) {
            abort(404);
        }
        if ($purchaseOrder->status !== 'pending') {
            throw ValidationException::withMessages(['status' => ["This order is already {$purchaseOrder->status}."]]);
        }

        $data = $request->validate(['payment_method' => ['sometimes', 'in:cash,bank,credit']]);
        $method = $data['payment_method'] ?? 'credit';

        DB::transaction(function () use ($purchaseOrder, $method) {
            foreach ($purchaseOrder->items as $item) {
                if ($item->product_id) {
                    Product::where('id', $item->product_id)->increment('stock', $item->quantity);
                }
            }

            if ($purchaseOrder->supplier_id) {
                $supplier = Supplier::where('id', $purchaseOrder->supplier_id)->lockForUpdate()->first();
                if ($supplier) {
                    if ($method === 'credit') {
                        $supplier->increment('payable', $purchaseOrder->total_cost);
                    }
                    $supplier->update(['last_delivery' => now()->toDateString()]);
                }
            }

            $purchaseOrder->update(['status' => 'received', 'received_at' => now()]);
        });

        if (in_array('accounting', $this->activeModules($request), true)) {
            $user = $this->authUser($request);
            LedgerEngine::recordPurchase($businessId, null, (float) $purchaseOrder->total_cost, $method, "PO {$purchaseOrder->reference}", $user->id, $user->name);
        }

        $supplierName = $purchaseOrder->supplier->name ?? null;
        $message = $method === 'credit'
            ? 'Order received — stock updated'.($supplierName ? ", added to {$supplierName}'s balance." : '.')
            : 'Order received and paid — stock updated.';

        return response()->json(['message' => $message]);
    }

    /** Only a still-pending order can be cancelled — the guard lives in the WHERE clause itself, not a separate read+check. */
    public function cancel(Request $request, PurchaseOrder $purchaseOrder)
    {
        $this->requireModule($request, 'procurement');

        $updated = PurchaseOrder::where('id', $purchaseOrder->id)
            ->where('business_id', $this->businessId($request))
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        if (! $updated) {
            throw ValidationException::withMessages(['status' => ['Purchase order not found or already finalized.']]);
        }

        return response()->json(['message' => 'Purchase order cancelled.']);
    }

    private function serialize(PurchaseOrder $o): array
    {
        return [
            'id' => $o->id,
            'reference' => $o->reference,
            'supplier' => $o->supplier->name ?? 'No supplier',
            'supplierId' => $o->supplier_id,
            'status' => $o->status,
            'notes' => $o->notes,
            'totalCost' => (float) $o->total_cost,
            'itemCount' => $o->items->sum('quantity'),
            'orderedAt' => $o->ordered_at->toIso8601String(),
            'receivedAt' => $o->received_at?->toIso8601String(),
            'items' => $o->items->map(fn ($i) => ['name' => $i->product_name, 'qty' => $i->quantity]),
        ];
    }
}
