<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RemoteOrder;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\LedgerEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RemoteOrderController extends Controller
{
    use ScopesTenant;

    public function index(Request $request)
    {
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $orders = RemoteOrder::query()
            ->with(['items', 'branch'])
            ->where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($request->string('status')->isNotEmpty(), fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('placed_at')
            ->limit(50)
            ->get();

        return response()->json($orders->map(fn (RemoteOrder $o) => [
            'id' => $o->id,
            'reference' => $o->reference,
            'customer' => $o->customer_name,
            'phone' => $o->phone,
            'branch' => $o->branch->name ?? null,
            'amount' => $o->amount,
            'status' => $o->status,
            'placedAt' => $o->placed_at->toIso8601String(),
            'items' => $o->items->map(fn ($i) => ['name' => $i->name, 'qty' => $i->quantity, 'price' => $i->unit_price]),
        ]));
    }

    public function cancel(Request $request, RemoteOrder $remoteOrder)
    {
        if ($remoteOrder->business_id !== $this->businessId($request)) {
            abort(404);
        }

        // The web app's equivalent checks businessId only, letting a branch-locked
        // manager cancel another branch's pending order — closed here.
        $branchId = $this->enforcedBranchId($request);
        if ($branchId && $remoteOrder->branch_id !== $branchId) {
            abort(404);
        }

        if ($remoteOrder->status !== 'pending') {
            return response()->json(['message' => "Order is already {$remoteOrder->status}."], 422);
        }

        $remoteOrder->update(['status' => 'cancelled']);

        return response()->json(['message' => "Order {$remoteOrder->reference} cancelled."]);
    }

    /**
     * What the QR scanner hands off to once it's found the order: records a
     * real sale at the order's own quoted line prices (no tax added on top —
     * that would surprise the customer at pickup), decrements stock the same
     * way the till does, and marks the order finished so it can't be
     * completed twice. Mirrors the web app's completeRemoteOrder() exactly.
     */
    public function complete(Request $request)
    {
        $this->assertClockedIn($request);

        $data = $request->validate([
            'reference' => ['required', 'string'],
            'method' => ['required', 'in:cash,mpesa,card,bank'],
        ]);

        $businessId = $this->businessId($request);
        $user = $this->authUser($request);

        $order = RemoteOrder::with('items')
            ->where('business_id', $businessId)
            ->where('reference', trim($data['reference']))
            ->first();

        if (! $order) {
            throw ValidationException::withMessages(['reference' => ['No order found with that reference.']]);
        }
        if ($order->status !== 'pending') {
            throw ValidationException::withMessages(['reference' => ["Order {$order->reference} is already {$order->status}."]]);
        }
        if ($order->items->isEmpty()) {
            throw ValidationException::withMessages(['reference' => ['This order has no items to complete.']]);
        }

        $productIds = $order->items->pluck('product_id')->filter()->all();
        $products = Product::where('business_id', $businessId)->whereIn('id', $productIds)->get()->keyBy('id');

        foreach ($order->items as $item) {
            if (! $item->product_id) {
                continue;
            }
            $product = $products->get($item->product_id);
            if (! $product) {
                throw ValidationException::withMessages(['reference' => ["{$item->name} is no longer in the catalogue."]]);
            }
            if ($product->stock < $item->quantity) {
                throw ValidationException::withMessages(['reference' => ["Only {$product->stock} of {$item->name} left in stock."]]);
            }
        }

        $sale = DB::transaction(function () use ($order, $products, $businessId, $user, $data) {
            $subtotal = $order->items->sum(fn ($i) => $i->unit_price * $i->quantity);

            $sale = Sale::create([
                'business_id' => $businessId,
                'branch_id' => $order->branch_id,
                'reference' => 'RCP-'.strtoupper(base_convert((string) now()->getPreciseTimestamp(3), 10, 36)),
                'customer_name' => $order->customer_name,
                'cashier_id' => $user->id,
                'cashier_name' => $user->name,
                'method' => $data['method'],
                'status' => 'paid',
                'subtotal' => $subtotal,
                'tax_rate' => 0,
                'tax_amount' => 0,
                'total' => $subtotal,
                'amount_paid' => $subtotal,
                'sold_at' => now(),
            ]);

            foreach ($order->items as $item) {
                $product = $item->product_id ? $products->get($item->product_id) : null;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item->product_id,
                    'name' => $item->name,
                    'sku' => $product->sku ?? null,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                ]);

                if ($item->product_id) {
                    Product::where('id', $item->product_id)->decrement('stock', $item->quantity);
                }
            }

            $order->update(['status' => 'finished']);

            return $sale;
        });

        if (in_array('accounting', $this->activeModules($request), true)) {
            LedgerEngine::recordSale($businessId, $sale->branch_id, (float) $sale->total, $sale->method, "Sale {$sale->reference}", $user->id, $user->name);
        }

        return response()->json([
            'message' => "Order completed — receipt {$sale->reference}.",
            'receiptReference' => $sale->reference,
        ]);
    }
}
