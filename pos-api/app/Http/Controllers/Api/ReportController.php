<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Debtor;
use App\Models\Expense;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Ports the web app's "/reports" (a full 30-day visual dashboard) and "/reports-generator"
 * (the real report builder: type + branch + date-range filters, generate, CSV export).
 * Gated by the "sales" module there too — reporting is bundled into that subscription,
 * not its own module.
 */
class ReportController extends Controller
{
    use ScopesTenant;

    const PAYMENT_LABELS = ['cash' => 'Cash', 'mpesa' => 'Mobile Money', 'card' => 'Card', 'invoice' => 'Invoice', 'bank' => 'Bank'];

    /**
     * The "/reports" dashboard — ported to match the web app's own /reports page: a
     * rolling-30-day KPI set, a 6-month revenue trend, category/branch/product
     * breakdowns, and (only when the accounting module is active) a full P&L.
     * Uses a 30-day rolling window rather than the literal calendar week, same reason
     * as the web app's viewReportStats(): a demo/seed business can have real recent
     * activity that isn't on the exact current day.
     */
    public function summary(Request $request)
    {
        $this->requireModule($request, 'sales');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $days = 30;
        $since = now()->subDays($days - 1)->startOfDay();

        $series = DB::table('sales')
            ->selectRaw("to_char(sold_at, 'YYYY-MM-DD') as date, to_char(sold_at, 'Dy') as day, coalesce(sum(total), 0) as revenue, count(id) as orders")
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('sold_at', '>=', $since)
            ->where('status', '!=', 'refunded')
            ->groupBy('date', 'day')
            ->orderBy('date')
            ->get();

        $orders = (int) $series->sum('orders');
        $averagePerDay = $series->count() ? round($orders / $series->count()) : 0;
        $bestDay = $series->sortByDesc('revenue')->first();

        $margin = $this->marginWithDelta($businessId, $branchId, $since, now()->subDays(($days * 2) - 1)->startOfDay());

        $byCategory = $this->salesByCategory($businessId, $branchId, $days);
        $byBranch = $this->salesByBranch($businessId, $branchId, $days);
        $topProducts = $this->topProductsByRevenue($businessId, $branchId, $days, 5);
        $revenue = array_sum(array_column($byCategory, 'revenue'));

        $accountingEnabled = in_array('accounting', $this->activeModules($request), true);
        $income = $accountingEnabled ? $this->incomeStatement($businessId, $branchId, $days, $margin['currentCost']) : null;

        return response()->json([
            'revenue' => $revenue,
            'orders' => $orders,
            'averagePerDay' => $averagePerDay,
            'marginPct' => $margin['marginPct'],
            'marginDeltaPct' => $margin['marginDeltaPct'],
            'bestDay' => $bestDay ? ['day' => $bestDay->day, 'revenue' => (float) $bestDay->revenue] : ['day' => '—', 'revenue' => 0],
            'accountingEnabled' => $accountingEnabled,
            'income' => $income,
            'monthlyTrend' => $this->monthlyRevenue($businessId, $branchId, 6),
            'byCategory' => $byCategory,
            'byBranch' => $byBranch,
            'topProducts' => $topProducts,
        ]);
    }

    private function salesByCategory(int $businessId, ?int $branchId, int $days): array
    {
        $since = now()->subDays($days - 1)->startOfDay();
        $rows = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->where('sales.sold_at', '>=', $since)
            ->selectRaw("coalesce(categories.name, 'Uncategorised') as name, sum(sale_items.quantity * sale_items.unit_price) as revenue")
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->get();

        return $rows->map(fn ($r) => ['name' => $r->name, 'revenue' => (float) $r->revenue])->values()->all();
    }

    private function salesByBranch(int $businessId, ?int $branchId, int $days): array
    {
        $since = now()->subDays($days - 1)->startOfDay();
        $rows = DB::table('sales')
            ->leftJoin('branches', 'branches.id', '=', 'sales.branch_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->where('sales.sold_at', '>=', $since)
            ->selectRaw("coalesce(branches.name, 'Unassigned') as name, sum(sales.total) as revenue")
            ->groupBy('branches.name')
            ->orderByDesc('revenue')
            ->get();

        return $rows->map(fn ($r) => ['name' => $r->name, 'revenue' => (float) $r->revenue])->values()->all();
    }

    private function topProductsByRevenue(int $businessId, ?int $branchId, int $days, int $limit): array
    {
        $since = now()->subDays($days - 1)->startOfDay();
        $rows = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->where('sales.sold_at', '>=', $since)
            ->selectRaw('sale_items.name as name, sum(sale_items.quantity * sale_items.unit_price) as revenue')
            ->groupBy('sale_items.name')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get();

        return $rows->map(fn ($r) => ['name' => $r->name, 'revenue' => (float) $r->revenue])->values()->all();
    }

    /**
     * Revenue, cost of sales and expenses by category for the trailing `days`. Takes
     * `$costOfSales` as a parameter rather than querying it itself — it's the exact same
     * figure (same window, same branch scope, same buying-price basis) that
     * marginWithDelta() already computed as a side effect, and at ~550ms per query on this
     * connection, not re-running it is a real saving, not a micro-optimisation.
     */
    private function incomeStatement(int $businessId, ?int $branchId, int $days, float $costOfSales): array
    {
        $since = now()->subDays($days - 1)->startOfDay();

        $revenue = (float) DB::table('sales')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('sold_at', '>=', $since)
            ->selectRaw("coalesce(sum(total) filter (where status != 'refunded'), 0) as v")
            ->value('v');

        $expenseRows = DB::table('expenses')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('incurred_on', '>=', $since)
            ->selectRaw('category, coalesce(sum(amount), 0) as amount')
            ->groupBy('category')
            ->orderByDesc('amount')
            ->get();

        $expenses = $expenseRows->map(fn ($r) => ['category' => $r->category, 'amount' => (float) $r->amount])->values();
        $totalExpenses = (float) $expenses->sum('amount');

        $grossProfit = $revenue - $costOfSales;

        return [
            'revenue' => $revenue,
            'costOfSales' => $costOfSales,
            'grossProfit' => $grossProfit,
            'expenses' => $expenses->all(),
            'totalExpenses' => $totalExpenses,
            'netProfit' => $grossProfit - $totalExpenses,
        ];
    }

    private function monthlyRevenue(int $businessId, ?int $branchId, int $months): array
    {
        $rows = DB::table('sales')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'refunded')
            ->where('sold_at', '>=', now()->startOfMonth()->subMonths($months - 1))
            ->selectRaw("to_char(sold_at, 'Mon YYYY') as month, to_char(sold_at, 'YYYY-MM') as key, coalesce(sum(total), 0) as revenue, count(id) as orders")
            ->groupBy('month', 'key')
            ->orderBy('key')
            ->get();

        return $rows->map(fn ($r) => ['month' => $r->month, 'revenue' => (float) $r->revenue, 'orders' => (int) $r->orders])->values()->all();
    }

    /**
     * Approximate gross margin — uses each product's CURRENT buying price as the cost
     * basis (sales don't snapshot cost at time of sale), same intentional simplification
     * the web app uses. Not a bug: margin on old sales shifts if buying prices change today.
     *
     * Computes the current AND previous window in a single query (via FILTER clauses)
     * instead of the four separate queries this used to take (revenue + cost, twice) —
     * on a remote connection like this one, each avoided round-trip is ~550ms.
     */
    private function marginWithDelta(int $businessId, ?int $branchId, $currentSince, $previousSince): array
    {
        $row = DB::table('sale_items')
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

        $currentRevenue = (float) $row->current_revenue;
        $currentCost = (float) $row->current_cost;
        $previousRevenue = (float) $row->previous_revenue;
        $previousCost = (float) $row->previous_cost;

        $currentMargin = $currentRevenue > 0 ? (($currentRevenue - $currentCost) / $currentRevenue) * 100 : 0;
        $previousMargin = $previousRevenue > 0 ? (($previousRevenue - $previousCost) / $previousRevenue) * 100 : 0;

        return [
            'marginPct' => round($currentMargin * 10) / 10,
            'marginDeltaPct' => round(($currentMargin - $previousMargin) * 10) / 10,
            'currentCost' => $currentCost,
        ];
    }

    /** The report builder — six report types plus one bonus (branch performance) the web app built the query for but never actually exposed anywhere. */
    public function generate(Request $request)
    {
        $this->requireModule($request, 'sales');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $data = $request->validate([
            'type' => ['required', 'in:expenses,total_expenses,sales,debtors,payment_analysis,product_summary,branch_performance'],
            'branch_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        if (! empty($data['from']) && ! empty($data['to']) && $data['from'] > $data['to']) {
            throw ValidationException::withMessages(['to' => ['End date must be on or after the start date.']]);
        }

        if ($data['type'] === 'branch_performance' && $this->enforcedBranchId($request) !== null) {
            abort(403, 'Only admins can compare performance across branches.');
        }

        $branchId = $this->enforcedBranchId($request, $data['branch_id'] ?? null);
        $from = $data['from'] ?? null;
        $to = $data['to'] ?? null;

        $report = match ($data['type']) {
            'expenses' => $this->expensesReport($businessId, $branchId, $from, $to),
            'total_expenses' => $this->totalExpensesReport($businessId, $branchId, $from, $to),
            'sales' => $this->salesReport($businessId, $branchId, $from, $to),
            'debtors' => $this->debtorsReport($businessId, $branchId, $from, $to),
            'payment_analysis' => $this->paymentAnalysisReport($businessId, $branchId, $from, $to),
            'product_summary' => $this->productSummaryReport($businessId, $branchId, $from, $to),
            'branch_performance' => $this->branchPerformanceReport($businessId, $from, $to),
        };

        return response()->json(['type' => $data['type']] + $report);
    }

    private function expensesReport(int $businessId, ?int $branchId, ?string $from, ?string $to): array
    {
        $rows = Expense::with('branch')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($from, fn ($q) => $q->whereDate('incurred_on', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('incurred_on', '<=', $to))
            ->orderByDesc('incurred_on')->orderByDesc('id')
            ->limit(500)->get();

        return [
            'columns' => [['key' => 'date', 'label' => 'Date'], ['key' => 'branch', 'label' => 'Branch'], ['key' => 'category', 'label' => 'Category'], ['key' => 'label', 'label' => 'Description'], ['key' => 'amount', 'label' => 'Amount'], ['key' => 'reference', 'label' => 'Ref']],
            'rows' => $rows->map(fn (Expense $e) => [
                'date' => $e->incurred_on->toDateString(), 'branch' => $e->branch->name ?? '—',
                'category' => $e->category, 'label' => $e->label, 'amount' => (float) $e->amount, 'reference' => $e->reference,
            ])->values(),
        ];
    }

    private function totalExpensesReport(int $businessId, ?int $branchId, ?string $from, ?string $to): array
    {
        $rows = Expense::query()
            ->selectRaw("to_char(incurred_on, 'YYYY-MM-DD') as date, branch_id, count(*) as cnt, coalesce(sum(amount), 0) as total")
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($from, fn ($q) => $q->whereDate('incurred_on', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('incurred_on', '<=', $to))
            ->groupBy('incurred_on', 'branch_id')
            ->orderByDesc('incurred_on')
            ->get();

        $branchNames = Branch::whereIn('id', $rows->pluck('branch_id')->filter()->unique())->pluck('name', 'id');

        return [
            'columns' => [['key' => 'date', 'label' => 'Date'], ['key' => 'branch', 'label' => 'Branch'], ['key' => 'count', 'label' => 'Count'], ['key' => 'total', 'label' => 'Total']],
            'rows' => $rows->map(fn ($r) => [
                'date' => $r->date, 'branch' => $branchNames[$r->branch_id] ?? '—',
                'count' => (int) $r->cnt, 'total' => (float) $r->total,
            ])->values(),
        ];
    }

    /**
     * Includes refunded sales with their own Status column — the web app's version
     * includes refunds too but with no status shown at all, silently inconsistent with
     * every other revenue total in the app (which all exclude refunds). Showing status
     * here instead of hiding it lets a manager reading this report actually notice.
     */
    private function salesReport(int $businessId, ?int $branchId, ?string $from, ?string $to): array
    {
        $rows = Sale::with(['branch', 'items'])
            ->withSum('items as items_qty', 'quantity')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($from, fn ($q) => $q->where('sold_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('sold_at', '<=', "{$to} 23:59:59"))
            ->orderByDesc('sold_at')
            ->limit(500)->get();

        return [
            'columns' => [['key' => 'reference', 'label' => 'Reference'], ['key' => 'date', 'label' => 'Date'], ['key' => 'branch', 'label' => 'Branch'], ['key' => 'customer', 'label' => 'Customer'], ['key' => 'items', 'label' => 'Items'], ['key' => 'amount', 'label' => 'Amount'], ['key' => 'method', 'label' => 'Method'], ['key' => 'status', 'label' => 'Status']],
            'rows' => $rows->map(fn (Sale $s) => [
                'reference' => $s->reference, 'date' => $s->sold_at->toDateString(), 'branch' => $s->branch->name ?? '—',
                'customer' => $s->customer_name, 'items' => (int) ($s->items_qty ?? 0), 'amount' => (float) $s->total,
                'method' => self::PAYMENT_LABELS[$s->method] ?? ucfirst($s->method), 'status' => ucfirst($s->status),
            ])->values(),
        ];
    }

    private function debtorsReport(int $businessId, ?int $branchId, ?string $from, ?string $to): array
    {
        $rows = Debtor::where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($from, fn ($q) => $q->where('recorded_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('recorded_at', '<=', "{$to} 23:59:59"))
            ->where('balance', '>', 0)
            ->orderByDesc('balance')
            ->limit(500)->get();

        return [
            'columns' => [['key' => 'date', 'label' => 'Date'], ['key' => 'name', 'label' => 'Debtor'], ['key' => 'itemTaken', 'label' => 'Item taken'], ['key' => 'balance', 'label' => 'Balance'], ['key' => 'status', 'label' => 'Status']],
            'rows' => $rows->map(fn (Debtor $d) => [
                'date' => $d->recorded_at->toDateString(), 'name' => $d->name,
                'itemTaken' => $d->item_taken ?? '—', 'balance' => (float) $d->balance, 'status' => 'Outstanding',
            ])->values(),
        ];
    }

    private function paymentAnalysisReport(int $businessId, ?int $branchId, ?string $from, ?string $to): array
    {
        $rows = Sale::where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', '!=', 'refunded')
            ->when($from, fn ($q) => $q->where('sold_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('sold_at', '<=', "{$to} 23:59:59"))
            ->selectRaw('method, count(id) as cnt, coalesce(sum(total), 0) as total')
            ->groupBy('method')
            ->orderByDesc('total')->get();

        return [
            'columns' => [['key' => 'method', 'label' => 'Method'], ['key' => 'count', 'label' => 'Count'], ['key' => 'amount', 'label' => 'Amount']],
            'rows' => $rows->map(fn ($r) => [
                'method' => self::PAYMENT_LABELS[$r->method] ?? ucfirst($r->method),
                'count' => (int) $r->cnt, 'amount' => (float) $r->total,
            ])->values(),
        ];
    }

    private function productSummaryReport(int $businessId, ?int $branchId, ?string $from, ?string $to): array
    {
        $rows = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->when($from, fn ($q) => $q->where('sales.sold_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('sales.sold_at', '<=', "{$to} 23:59:59"))
            ->selectRaw('sale_items.name as product, sale_items.sku as sku, sum(sale_items.quantity) as units, coalesce(sum(sale_items.quantity * sale_items.unit_price), 0) as revenue')
            ->groupBy('sale_items.name', 'sale_items.sku')
            ->orderByDesc('revenue')
            ->limit(200)->get();

        return [
            'columns' => [['key' => 'product', 'label' => 'Product'], ['key' => 'sku', 'label' => 'SKU'], ['key' => 'units', 'label' => 'Units sold'], ['key' => 'revenue', 'label' => 'Revenue']],
            'rows' => $rows->map(fn ($r) => [
                'product' => $r->product, 'sku' => $r->sku ?? '—', 'units' => (int) $r->units, 'revenue' => (float) $r->revenue,
            ])->values(),
        ];
    }

    /**
     * Bonus report type — the web app has this exact query (getBranchPerformance) fully
     * built and correct, but never wired it into any page. Real, useful, zero-risk to add.
     */
    private function branchPerformanceReport(int $businessId, ?string $from, ?string $to): array
    {
        $since = $from ?: now()->subDays(29)->toDateString();
        $until = $to ? "{$to} 23:59:59" : now()->toDateString().' 23:59:59';

        $rows = Branch::where('business_id', $businessId)->orderBy('name')->get()
            ->map(function (Branch $b) use ($since, $until) {
                $scope = fn () => Sale::where('branch_id', $b->id)->where('status', '!=', 'refunded')
                    ->where('sold_at', '>=', $since)->where('sold_at', '<=', $until);

                return ['branch' => $b->name, 'revenue' => (float) $scope()->sum('total'), 'receipts' => $scope()->count()];
            })
            ->sortByDesc('revenue')->values();

        return [
            'columns' => [['key' => 'branch', 'label' => 'Branch'], ['key' => 'revenue', 'label' => 'Revenue'], ['key' => 'receipts', 'label' => 'Receipts']],
            'rows' => $rows,
        ];
    }

    private function requireManagerUp(Request $request): void
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can view reports.');
        }
    }
}
