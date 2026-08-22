<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    use ScopesTenant;

    /** Base64 image text can run ~1.37x the original byte size — same ceiling the Payment Proofs upload enforces. */
    const MAX_IMAGE_DATA_URL_LENGTH = 2 * 1024 * 1024 * 1.4;

    /** Matches the web app's real getExpiryAlerts() query default — not the "7 days" its own UI copy mistakenly claims. */
    const EXPIRY_ALERT_DAYS = 30;

    /** Also feeds the New Sale product grid (module: pos) — never gate this on the inventory module. */
    public function index(Request $request)
    {
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $products = Product::query()
            ->with(['category', 'branch'])
            ->where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($request->boolean('low_stock'), fn ($q) => $q->lowStock())
            ->when($request->string('search')->isNotEmpty(), fn ($q) => $q->where('name', 'ilike', '%'.$request->string('search').'%'))
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        return response()->json($products->map(fn (Product $p) => $this->serialize($p)));
    }

    /**
     * Real aggregate numbers for the Inventory dashboard — the web app's own /inventory
     * page has two of these hardcoded (low stock, "fastest mover") instead of reading
     * them from this same query.
     *
     * One query instead of five — all five read the same products table with the same
     * scope, so a single row of aggregates covers all of them.
     */
    public function summary(Request $request)
    {
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $row = Product::query()
            ->where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->selectRaw(
                'count(*) as sku_count,
                 coalesce(sum(stock), 0) as stock_units,
                 coalesce(sum(selling_price * stock), 0) as retail_value,
                 coalesce(sum(buying_price * stock), 0) as cost_value,
                 count(*) filter (where stock <= low_stock_threshold) as low_stock',
            )
            ->first();

        return response()->json([
            'skuCount' => (int) $row->sku_count,
            'stockUnits' => (int) $row->stock_units,
            'retailValue' => (float) $row->retail_value,
            'costValue' => (float) $row->cost_value,
            'lowStock' => (int) $row->low_stock,
        ]);
    }

    /**
     * The web app's Inventory dashboard charts: stock-level health (in stock / low /
     * out), best sellers by revenue over the last 30 days, and stock value per branch
     * — same three real queries as viewStockLevelBreakdown()/viewTopMovers()/
     * viewStockByBranch().
     */
    public function analytics(Request $request)
    {
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $levels = Product::where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->selectRaw(
                'count(*) filter (where stock > low_stock_threshold) as healthy,
                 count(*) filter (where stock > 0 and stock <= low_stock_threshold) as low,
                 count(*) filter (where stock = 0) as out',
            )
            ->first();

        $byBranch = DB::table('products')
            ->leftJoin('branches', 'branches.id', '=', 'products.branch_id')
            ->where('products.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('products.branch_id', $branchId))
            ->selectRaw("coalesce(branches.name, 'Unassigned') as name, coalesce(sum(products.stock), 0) as units, coalesce(sum(products.stock * products.buying_price), 0) as value")
            ->groupBy('branches.name')
            ->orderByDesc('value')
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'units' => (int) $r->units, 'value' => (float) $r->value]);

        $since = now()->subDays(29)->startOfDay();
        $topMovers = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('sales.branch_id', $branchId))
            ->where('sales.status', '!=', 'refunded')
            ->where('sales.sold_at', '>=', $since)
            ->selectRaw('sale_items.name as name, sum(sale_items.quantity) as units, sum(sale_items.quantity * sale_items.unit_price) as revenue')
            ->groupBy('sale_items.name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'units' => (int) $r->units, 'revenue' => (float) $r->revenue]);

        return response()->json([
            'levels' => ['healthy' => (int) $levels->healthy, 'low' => (int) $levels->low, 'out' => (int) $levels->out],
            'byBranch' => $byBranch->values(),
            'topMovers' => $topMovers->values(),
        ]);
    }

    /** Products expiring within EXPIRY_ALERT_DAYS, soonest first. */
    public function expiring(Request $request)
    {
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $products = Product::query()
            ->with(['category', 'branch'])
            ->where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->expiringWithin(self::EXPIRY_ALERT_DAYS)
            ->orderBy('expiry_date')
            ->limit(200)
            ->get();

        return response()->json($products->map(fn (Product $p) => $this->serialize($p)));
    }

    /** Mirrors the web app's createProduct(): category is free text, auto-creating a category row if it doesn't already exist. */
    public function store(Request $request)
    {
        $this->requireModule($request, 'inventory');
        $businessId = $this->businessId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'selling_price' => ['required', 'numeric', 'min:0.01'],
            'buying_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'branch_id' => ['nullable', 'integer'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'expiry_date' => ['nullable', 'date'],
            'image_data_url' => ['nullable', 'string'],
        ]);

        $this->assertValidImage($data['image_data_url'] ?? null);

        $branchId = $this->resolveBranchId($businessId, $data['branch_id'] ?? null);
        $categoryId = $this->resolveCategoryId($businessId, $data['category'] ?? null);

        $product = Product::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'category_id' => $categoryId,
            'sku' => 'P-'.strtoupper(base_convert((string) now()->getPreciseTimestamp(3), 10, 36)),
            'name' => trim($data['name']),
            'selling_price' => $data['selling_price'],
            'buying_price' => $data['buying_price'] ?? 0,
            'stock' => $data['stock'] ?? 0,
            'low_stock_threshold' => $data['low_stock_threshold'] ?? 12,
            'expiry_date' => $data['expiry_date'] ?? null,
            'image_path' => $data['image_data_url'] ?? null,
        ]);

        return response()->json($this->serialize($product->load(['category', 'branch'])), 201);
    }

    /** Mirrors updateProduct(): a real partial update, unlike the web app's own "Save changes" button which never called it. */
    public function update(Request $request, Product $product)
    {
        $this->requireModule($request, 'inventory');
        $businessId = $this->businessId($request);

        if ($product->business_id !== $businessId) {
            abort(404);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:255'],
            'selling_price' => ['sometimes', 'numeric', 'min:0.01'],
            'buying_price' => ['sometimes', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'branch_id' => ['sometimes', 'nullable', 'integer'],
            'low_stock_threshold' => ['sometimes', 'integer', 'min:0'],
            'expiry_date' => ['sometimes', 'nullable', 'date'],
            'image_data_url' => ['sometimes', 'nullable', 'string'],
            'remove_image' => ['sometimes', 'boolean'],
        ]);

        if (! empty($data['image_data_url'])) {
            $this->assertValidImage($data['image_data_url']);
        }

        $updates = [];
        if (array_key_exists('name', $data)) {
            $updates['name'] = trim($data['name']);
        }
        if (array_key_exists('category', $data)) {
            $updates['category_id'] = $this->resolveCategoryId($businessId, $data['category']);
        }
        if (array_key_exists('selling_price', $data)) {
            $updates['selling_price'] = $data['selling_price'];
        }
        if (array_key_exists('buying_price', $data)) {
            $updates['buying_price'] = $data['buying_price'];
        }
        if (array_key_exists('stock', $data)) {
            $updates['stock'] = $data['stock'];
        }
        if (array_key_exists('branch_id', $data)) {
            $updates['branch_id'] = $this->resolveBranchId($businessId, $data['branch_id']);
        }
        if (array_key_exists('low_stock_threshold', $data)) {
            $updates['low_stock_threshold'] = $data['low_stock_threshold'];
        }
        if (array_key_exists('expiry_date', $data)) {
            $updates['expiry_date'] = $data['expiry_date'];
        }
        if (! empty($data['remove_image'])) {
            $updates['image_path'] = null;
        } elseif (! empty($data['image_data_url'])) {
            $updates['image_path'] = $data['image_data_url'];
        }

        $product->update($updates);

        return response()->json($this->serialize($product->fresh(['category', 'branch'])));
    }

    /** Hard delete, same as the web app — there's no soft-delete/archive column on this table. */
    public function destroy(Request $request, Product $product)
    {
        $this->requireModule($request, 'inventory');

        if ($product->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $name = $product->name;
        $product->delete();

        return response()->json(['message' => "\"{$name}\" removed from the catalogue."]);
    }

    private function assertValidImage(?string $dataUrl): void
    {
        if ($dataUrl === null) {
            return;
        }
        if (! str_starts_with($dataUrl, 'data:image/')) {
            throw ValidationException::withMessages(['image_data_url' => ['Attach an image file.']]);
        }
        if (strlen($dataUrl) > self::MAX_IMAGE_DATA_URL_LENGTH) {
            throw ValidationException::withMessages(['image_data_url' => ['Image is too large — keep it under 2MB.']]);
        }
    }

    private function resolveCategoryId(int $businessId, ?string $name): ?int
    {
        $name = trim($name ?? '') ?: 'Uncategorised';

        return Category::firstOrCreate(
            ['business_id' => $businessId, 'name' => $name],
        )->id;
    }

    private function resolveBranchId(int $businessId, ?int $branchId): ?int
    {
        if (! $branchId) {
            return null;
        }

        return Branch::where('business_id', $businessId)->where('id', $branchId)->value('id');
    }

    private function serialize(Product $p): array
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'sku' => $p->sku,
            'category' => $p->category->name ?? null,
            'categoryId' => $p->category_id,
            'branch' => $p->branch->name ?? null,
            'branchId' => $p->branch_id,
            'price' => (float) $p->selling_price,
            'buyingPrice' => (float) $p->buying_price,
            'stock' => $p->stock,
            'lowStockThreshold' => $p->low_stock_threshold,
            'lowStock' => $p->stock <= $p->low_stock_threshold,
            'expiryDate' => $p->expiry_date?->toDateString(),
            'imagePath' => $p->image_path,
        ];
    }
}
