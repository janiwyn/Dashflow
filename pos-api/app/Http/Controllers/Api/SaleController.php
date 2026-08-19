<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\LedgerEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    use ScopesTenant;

    /** Matches the web terminal's own flat VAT rate — every sale here should total the same way it would at the till. */
    const TAX_RATE = 16;

    public function index(Request $request)
    {
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $sales = Sale::query()
            ->with('branch')
            ->withSum('items as items_qty', 'quantity')
            ->where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('sold_at')
            ->limit(100)
            ->get();

        return response()->json($sales->map(fn (Sale $s) => [
            'id' => $s->id,
            'reference' => $s->reference,
            'customer' => $s->customer_name,
            'branch' => $s->branch->name ?? null,
            'cashier' => $s->cashier_name,
            'items' => (int) ($s->items_qty ?? 0),
            'method' => $s->method,
            'status' => $s->status,
            'total' => $s->total,
            'soldAt' => $s->sold_at->toIso8601String(),
            'time' => $s->sold_at->timezone(config('app.timezone'))->format('H:i'),
        ]));
    }

    /** Same three numbers the web app's Sales page leads with — today's gross, receipts and refunds, each with a vs-yesterday delta where it makes sense. */
    public function stats(Request $request)
    {
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $scope = fn () => Sale::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $todayRevenue = (float) (clone $scope())->where('status', '!=', 'refunded')->whereDate('sold_at', now()->toDateString())->sum('total');
        $todayReceipts = (clone $scope())->where('status', '!=', 'refunded')->whereDate('sold_at', now()->toDateString())->count();
        $yesterdayRevenue = (float) (clone $scope())->where('status', '!=', 'refunded')->whereDate('sold_at', now()->subDay()->toDateString())->sum('total');
        $yesterdayReceipts = (clone $scope())->where('status', '!=', 'refunded')->whereDate('sold_at', now()->subDay()->toDateString())->count();

        $refundsToday = (clone $scope())->where('status', 'refunded')->whereDate('sold_at', now()->toDateString());
        $refundAmount = (float) (clone $refundsToday)->sum('total');
        $refundCount = (clone $refundsToday)->count();

        $pending = (clone $scope())->where('status', 'pending')->count();

        $delta = fn ($now, $prev) => $prev > 0 ? round((($now - $prev) / $prev) * 100) : null;

        return response()->json([
            'gross' => $todayRevenue,
            'grossDeltaPct' => $delta($todayRevenue, $yesterdayRevenue),
            'receipts' => $todayReceipts,
            'receiptsDeltaPct' => $delta($todayReceipts, $yesterdayReceipts),
            'refunds' => $refundAmount,
            'refundCount' => $refundCount,
            'pending' => $pending,
        ]);
    }

    /**
     * A single sale's full receipt detail. Pass ?reference= to look up a specific
     * sale (e.g. from the Sales list or right after completing one); omit it to
     * fall back to the business's most recent sale, matching what the web app's
     * receipt-preview page shows right after a checkout redirect.
     */
    public function receipt(Request $request)
    {
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);
        $reference = $request->string('reference')->toString() ?: null;

        $query = Sale::with(['items', 'branch', 'customer'])
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $sale = $reference
            ? (clone $query)->where('reference', $reference)->first()
            : (clone $query)->orderByDesc('sold_at')->first();

        if (! $sale) {
            return response()->json(['message' => 'Receipt not found.'], 404);
        }

        $business = Business::find($businessId);

        return response()->json([
            'reference' => $sale->reference,
            'date' => $sale->sold_at->toIso8601String(),
            'businessName' => $business->name ?? null,
            'customerName' => $sale->customer_name,
            'customerContact' => $sale->customer->contact ?? null,
            'customerEmail' => $sale->customer->email ?? null,
            'cashier' => $sale->cashier_name ?? '—',
            'branch' => $sale->branch->name ?? null,
            'method' => $sale->method,
            'dueDate' => $sale->due_date?->toDateString(),
            'items' => $sale->items->map(fn (SaleItem $i) => [
                'name' => $i->name,
                'qty' => $i->quantity,
                'price' => (float) $i->unit_price,
            ]),
            'subtotal' => (float) $sale->subtotal,
            'taxRate' => (float) $sale->tax_rate,
            'tax' => (float) $sale->tax_amount,
            'total' => (float) $sale->total,
            'amountPaid' => (float) $sale->amount_paid,
            'balance' => round((float) $sale->total - (float) $sale->amount_paid, 2),
        ]);
    }

    /** The same core action the till performs: validate stock/prices against the database, charge VAT, decrement stock. */
    public function store(Request $request)
    {
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);
        $user = $this->authUser($request);

        $this->assertClockedIn($request);

        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'method' => ['required', 'in:cash,mpesa,card,invoice,bank'],
            'customer_id' => ['nullable', 'integer'],
            'customer_name' => ['nullable', 'string', 'max:255'],
        ]);

        $customerId = null;
        $customerName = trim($data['customer_name'] ?? '') ?: 'Walk-in';
        if (! empty($data['customer_id'])) {
            $customer = Customer::where('id', $data['customer_id'])->where('business_id', $businessId)->first();
            if (! $customer) {
                throw ValidationException::withMessages(['customer_id' => ['Selected customer not found.']]);
            }
            $customerId = $customer->id;
            $customerName = $customer->name;
        }

        $productIds = collect($data['items'])->pluck('product_id')->all();
        $products = Product::query()
            ->where('business_id', $businessId)
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        foreach ($data['items'] as $line) {
            $product = $products->get($line['product_id']);
            if (! $product) {
                throw ValidationException::withMessages(['items' => ['One of the selected products no longer exists.']]);
            }
            if ($product->stock < $line['quantity']) {
                throw ValidationException::withMessages(['items' => ["Only {$product->stock} of {$product->name} left in stock."]]);
            }
        }

        $sale = DB::transaction(function () use ($data, $products, $businessId, $branchId, $user, $customerId, $customerName) {
            $subtotal = collect($data['items'])->sum(fn ($line) => $products->get($line['product_id'])->selling_price * $line['quantity']);
            $taxAmount = round($subtotal * self::TAX_RATE / 100);
            $total = $subtotal + $taxAmount;

            $sale = Sale::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'reference' => 'RCP-'.strtoupper(base_convert((string) now()->getPreciseTimestamp(3), 10, 36)),
                'customer_id' => $customerId,
                'customer_name' => $customerName,
                'cashier_id' => $user->id,
                'cashier_name' => $user->name,
                'method' => $data['method'],
                'status' => 'paid',
                'subtotal' => $subtotal,
                'tax_rate' => self::TAX_RATE,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'due_date' => $data['method'] === 'invoice' ? now()->addDays(30)->toDateString() : null,
                'amount_paid' => $total,
                'sold_at' => now(),
            ]);

            foreach ($data['items'] as $line) {
                $product = $products->get($line['product_id']);

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $line['quantity'],
                    'unit_price' => $product->selling_price,
                ]);

                Product::where('id', $product->id)->decrement('stock', $line['quantity']);
            }

            return $sale;
        });

        if (in_array('accounting', $this->activeModules($request), true)) {
            LedgerEngine::recordSale($businessId, $branchId, (float) $sale->total, $sale->method, "Sale {$sale->reference}", $user->id, $user->name);
        }

        return response()->json([
            'id' => $sale->id,
            'reference' => $sale->reference,
            'subtotal' => (float) $sale->subtotal,
            'tax' => (float) $sale->tax_amount,
            'total' => (float) $sale->total,
        ], 201);
    }
}
