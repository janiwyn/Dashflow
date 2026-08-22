<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Branches are a core, always-available feature in the web app — not gated behind any
 * subscription module — so this controller mirrors that: role gates only, no
 * requireModule() calls anywhere.
 */
class BranchController extends Controller
{
    use ScopesTenant;

    /** Only meaningful for admin/super — a manager/staff account is already locked to one branch. Kept lightweight since several other forms' dropdowns depend on this exact shape. */
    public function index(Request $request)
    {
        $branches = Branch::where('business_id', $this->businessId($request))
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($branches);
    }

    /**
     * The richer list — manager+ only, matches the web app's "/list-branches" (merged
     * with "/branches", which is the same data as a card grid with one hardcoded stat).
     * A manager only ever sees their own branch here, same as every other branch-scoped
     * list in this app.
     */
    public function list(Request $request)
    {
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request);

        $branches = Branch::where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('id', $branchId))
            ->orderBy('id')
            ->get();

        $today = now()->toDateString();

        // Was 2 queries PER branch (an N+1) — grouped into 2 queries total for every
        // branch on the list, then joined in PHP, regardless of how many branches exist.
        $staffCounts = Employee::whereIn('branch_id', $branches->pluck('id'))
            ->where('status', 'active')
            ->selectRaw('branch_id, count(*) as cnt')
            ->groupBy('branch_id')
            ->pluck('cnt', 'branch_id');

        $todaySales = Sale::whereIn('branch_id', $branches->pluck('id'))
            ->where('status', '!=', 'refunded')
            ->whereDate('sold_at', $today)
            ->selectRaw('branch_id, coalesce(sum(total), 0) as total')
            ->groupBy('branch_id')
            ->pluck('total', 'branch_id');

        return response()->json($branches->map(function (Branch $b) use ($staffCounts, $todaySales) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'location' => $b->location,
                'contact' => $b->contact,
                'managerName' => $b->manager_name,
                'status' => $b->status,
                'staffCount' => (int) ($staffCounts[$b->id] ?? 0),
                'todaySales' => (float) ($todaySales[$b->id] ?? 0),
            ];
        }));
    }

    /** Admin/super only — matches the web app exactly (managers can edit a branch but not create one). New branches always start "open", same as there. */
    public function store(Request $request)
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin'], true)) {
            abort(403, 'Only admins can create a branch.');
        }

        $data = $this->validated($request, false);

        $branch = Branch::create([
            'business_id' => $this->businessId($request),
            'name' => trim($data['name']),
            'location' => $this->cleaned($data['location'] ?? null),
            'contact' => $this->cleaned($data['contact'] ?? null),
            'manager_name' => $this->cleaned($data['manager_name'] ?? null),
            'status' => 'open',
        ]);

        return response()->json(['message' => 'Branch created successfully!', 'id' => $branch->id], 201);
    }

    /**
     * Manager+ only, same as the web app's real updateBranch() gate — though the web
     * app's edit page itself is stricter (admin/super only) than its own action, and its
     * form has no manager-name field at all, meaning a branch's manager can never be
     * changed after creation there. This lets a manager reach it (matching the action's
     * real intent) and includes manager name as an editable field.
     */
    public function update(Request $request, Branch $branch)
    {
        $this->requireManagerUp($request);
        $this->scopeOrFail($request, $branch);

        $data = $this->validated($request, true);

        $updates = [];
        if (array_key_exists('name', $data)) {
            $updates['name'] = trim($data['name']);
        }
        foreach (['location', 'contact', 'manager_name'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $this->cleaned($data[$field]);
            }
        }

        $branch->update($updates);

        return response()->json(['message' => 'Branch updated successfully!']);
    }

    /** Manager+ only. The web app has this exact toggle fully built server-side but never exposed it in any UI — wired for real here. */
    public function setStatus(Request $request, Branch $branch)
    {
        $this->requireManagerUp($request);
        $this->scopeOrFail($request, $branch);

        $data = $request->validate(['status' => ['required', 'in:open,closed']]);
        $branch->update(['status' => $data['status']]);

        return response()->json(['message' => "Branch marked {$data['status']}."]);
    }

    /**
     * Merges the web app's "/branch" dashboard (stats, revenue trend, payment mix, staff)
     * with "/branch-view" (stock). The web app's revenue-trend chart has a real bug —
     * it's fetched without a branch filter, so it silently shows the whole business's
     * combined revenue instead of this branch's — fixed here to actually scope to the
     * branch being viewed.
     */
    public function dashboard(Request $request, Branch $branch)
    {
        $this->requireManagerUp($request);
        $this->scopeOrFail($request, $branch);

        $totalExpenses = (float) Expense::where('branch_id', $branch->id)->sum('amount');

        $staff = Employee::with('user')->where('branch_id', $branch->id)->where('status', 'active')->orderBy('name')->get();

        $since = now()->subDays(6)->startOfDay();
        $series = DB::table('sales')
            ->selectRaw("to_char(sold_at, 'YYYY-MM-DD') as date, to_char(sold_at, 'Dy') as day, coalesce(sum(total), 0) as revenue")
            ->where('branch_id', $branch->id)
            ->where('sold_at', '>=', $since)
            ->where('status', '!=', 'refunded')
            ->groupBy('date', 'day')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['day' => $r->day, 'revenue' => (float) $r->revenue]);

        // totalSales and receipts don't need their own queries — they're just the sum and
        // count of the payment-mix rows we're already fetching, one query below instead of three.
        $paymentMixRaw = Sale::where('branch_id', $branch->id)->where('status', '!=', 'refunded')
            ->selectRaw('method, coalesce(sum(total), 0) as total, count(*) as cnt')
            ->groupBy('method')->get();
        $totalSales = (float) $paymentMixRaw->sum('total');
        $receipts = (int) $paymentMixRaw->sum('cnt');
        $paymentMix = $paymentMixRaw->map(fn ($r) => [
            'method' => $r->method,
            'amount' => (float) $r->total,
            'percent' => $totalSales > 0 ? round(((float) $r->total / $totalSales) * 100) : 0,
        ])->values();

        $stock = Product::where('branch_id', $branch->id)
            ->selectRaw('count(*) as cnt, coalesce(sum(buying_price * stock), 0) as value')
            ->first();

        return response()->json([
            'branch' => [
                'id' => $branch->id, 'name' => $branch->name, 'location' => $branch->location,
                'contact' => $branch->contact, 'managerName' => $branch->manager_name, 'status' => $branch->status,
            ],
            'financials' => [
                'totalSales' => $totalSales, 'totalExpenses' => $totalExpenses,
                'profit' => $totalSales - $totalExpenses, 'receipts' => $receipts,
            ],
            'staff' => $staff->map(fn (Employee $e) => [
                'id' => $e->id, 'name' => $e->name, 'role' => $e->user->role ?? 'staff',
                'position' => $e->position, 'phone' => $e->phone,
            ]),
            'revenueSeries' => $series,
            'paymentMix' => $paymentMix,
            'stock' => ['count' => (int) $stock->cnt, 'value' => (float) $stock->value],
        ]);
    }

    private function requireManagerUp(Request $request): void
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can view branches.');
        }
    }

    /** A manager may only touch their own branch — mirrors the web app's enforcedBranchId() scoping. */
    private function scopeOrFail(Request $request, Branch $branch): void
    {
        if ($branch->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $branchId = $this->enforcedBranchId($request);
        if ($branchId && $branch->id !== $branchId) {
            abort(404);
        }
    }

    private function cleaned(?string $value): ?string
    {
        $trimmed = trim($value ?? '');

        return $trimmed !== '' ? $trimmed : null;
    }

    private function validated(Request $request, bool $isUpdate): array
    {
        $data = $request->validate([
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contact' => ['sometimes', 'nullable', 'string', 'max:255'],
            'manager_name' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        if (array_key_exists('name', $data) && trim($data['name']) === '') {
            throw ValidationException::withMessages(['name' => ['Branch name is required.']]);
        }

        return $data;
    }
}
