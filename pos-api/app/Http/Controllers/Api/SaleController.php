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

    /**
     * The web app's Sales dashboard headline row — gross, receipts, customers served,
     * average order value, profit and refunds, each vs the 30 days before. A rolling
     * 30-day window rather than literal today/yesterday, same reason as the web app's
     * viewSalesStats(): a demo/seed business can have real recent activity that isn't
     * on the exact current calendar day.
     *
     * Two queries via FILTER clauses instead of what would otherwise be well over a
     * dozen separate sum()/count() calls — one against `sales` for revenue/receipts/
     * customers/refunds/pending, one against `sale_items` (joined to products) for the
     * cost basis profit needs. On this connection every avoided round-trip is ~550ms.
     */
    public function stats(Request $request)
    {
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $days = 30;
        $currentSince = now()->subDays($days - 1)->startOfDay();
        $previousSince = now()->subDays(($days * 2) - 1)->startOfDay();

        $salesRow = DB::table('sales')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('sold_at', '>=', $previousSince)
            ->selectRaw(
                "coalesce(sum(total) filter (where status != 'refunded' and sold_at >= ?), 0) as current_revenue,
                 count(*) filter (where status != 'refunded' and sold_at >= ?) as current_receipts,
                 count(distinct customer_id) filter (where status != 'refunded' and sold_at >= ?) as current_customers,
                 coalesce(sum(total) filter (where status != 'refunded' and sold_at < ?), 0) as previous_revenue,
                 count(*) filter (where status != 'refunded' and sold_at < ?) as previous_receipts,
                 count(distinct customer_id) filter (where status != 'refunded' and sold_at < ?) as previous_customers,
                 coalesce(sum(total) filter (where status = 'refunded' and sold_at >= ?), 0) as refund_amount,
                 count(*) filter (where status = 'refunded' and sold_at >= ?) as refund_count",
                [$currentSince, $currentSince, $currentSince, $currentSince, $currentSince, $currentSince, $currentSince, $currentSince],
            )
            ->first();

        // Pending has no date bound in the web app either — every pending receipt ever, not just this window.
        $pending = DB::table('sales')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'pending')
            ->count();

        $profitRow = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->where('sales.sold_at', '>=', $previousSince)
            ->selectRaw(
                'coalesce(sum(sale_items.quantity * sale_items.unit_price) filter (where sales.sold_at >= ?), 0) as current_revenue,
                 coalesce(sum(sale_items.quantity * products.buying_price) filter (where sales.sold_at >= ?), 0) as current_cost,
                 coalesce(sum(sale_items.quantity * sale_items.unit_price) filter (where sales.sold_at < ?), 0) as previous_revenue,
                 coalesce(sum(sale_items.quantity * products.buying_price) filter (where sales.sold_at < ?), 0) as previous_cost',
                [$currentSince, $currentSince, $currentSince, $currentSince],
            )
            ->first();

        $currentRevenue = (float) $salesRow->current_revenue;
        $currentReceipts = (int) $salesRow->current_receipts;
        $currentProfit = (float) $profitRow->current_revenue - (float) $profitRow->current_cost;
        $previousProfit = (float) $profitRow->previous_revenue - (float) $profitRow->previous_cost;

        $delta = fn ($now, $prev) => $prev > 0 ? round((($now - $prev) / $prev) * 100) : null;

        return response()->json([
            'gross' => $currentRevenue,
            'grossDeltaPct' => $delta($currentRevenue, (float) $salesRow->previous_revenue),
            'receipts' => $currentReceipts,
            'receiptsDeltaPct' => $delta($currentReceipts, (int) $salesRow->previous_receipts),
            'refunds' => (float) $salesRow->refund_amount,
            'refundCount' => (int) $salesRow->refund_count,
            'pending' => $pending,
            'averageOrderValue' => $currentReceipts ? round($currentRevenue / $currentReceipts) : 0,
            'profit' => $currentProfit,
            'profitDeltaPct' => $delta($currentProfit, $previousProfit),
            'customers' => (int) $salesRow->current_customers,
            'customersDeltaPct' => $delta((int) $salesRow->current_customers, (int) $salesRow->previous_customers),
        ]);
    }

    /**
     * The web app's Sales dashboard chart data: category/branch breakdowns, a 14-day
     * revenue-vs-profit trend, top 5 products and the payment-method mix — all real,
     * trailing-30-day (or 14-day for the daily trend) figures, same as viewSalesAnalytics().
     */
    public function analytics(Request $request)
    {
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);
        $since30 = now()->subDays(29)->startOfDay();
        $since14 = now()->subDays(13)->startOfDay();

        $byCategory = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->where('sales.sold_at', '>=', $since30)
            ->selectRaw("coalesce(categories.name, 'Uncategorised') as name, sum(sale_items.quantity * sale_items.unit_price) as revenue")
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'revenue' => (float) $r->revenue]);

        $byBranch = DB::table('sales')
            ->leftJoin('branches', 'branches.id', '=', 'sales.branch_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->where('sales.sold_at', '>=', $since30)
            ->selectRaw("coalesce(branches.name, 'Unassigned') as name, sum(sales.total) as revenue")
            ->groupBy('branches.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'revenue' => (float) $r->revenue]);

        $profitSeries = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->where('sales.sold_at', '>=', $since14)
            ->selectRaw(
                "to_char(sales.sold_at, 'YYYY-MM-DD') as date, to_char(sales.sold_at, 'DD Mon') as day,
                 coalesce(sum(sale_items.quantity * sale_items.unit_price), 0) as revenue,
                 coalesce(sum(sale_items.quantity * products.buying_price), 0) as cost",
            )
            ->groupBy('date', 'day')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['day' => $r->day, 'revenue' => (float) $r->revenue, 'profit' => (float) $r->revenue - (float) $r->cost]);

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->where('sales.sold_at', '>=', $since30)
            ->selectRaw('sale_items.name as name, sum(sale_items.quantity * sale_items.unit_price) as revenue')
            ->groupBy('sale_items.name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'revenue' => (float) $r->revenue]);

        $paymentTotal = DB::table('sales')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'refunded')
            ->where('sold_at', '>=', $since30)
            ->count();

        $paymentBreakdown = DB::table('sales')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'refunded')
            ->where('sold_at', '>=', $since30)
            ->selectRaw('method, count(*) as cnt, coalesce(sum(total), 0) as total')
            ->groupBy('method')
            ->orderByDesc('total')
            ->get()
            // Raw method key, not the label — the PWA's existing renderPaymentMixDonut()
            // (already used on the Branch dashboard) colours and capitalises by this
            // exact key, so keeping it raw here reuses that component as-is.
            ->map(fn ($r) => [
                'method' => $r->method,
                'count' => (int) $r->cnt,
                'amount' => (float) $r->total,
                'percent' => $paymentTotal > 0 ? round(($r->cnt / $paymentTotal) * 100) : 0,
            ]);

        return response()->json([
            'byCategory' => $byCategory->values(),
            'byBranch' => $byBranch->values(),
            'profitSeries' => $profitSeries->values(),
            'topProducts' => $topProducts->values(),
            'paymentBreakdown' => $paymentBreakdown->values(),
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
