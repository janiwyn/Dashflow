<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\LedgerAccount;
use App\Models\LedgerEntry;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The three real, ledger-backed reports, the chart of accounts, and the per-account
 * ledger drill-down. Manager+ only — matches the web app's gate on every accounting
 * page. All business-wide, never branch-scoped (neither the ledger nor the cash book
 * has a branch column, on either side of the port).
 */
class AccountingController extends Controller
{
    use ScopesTenant;

    const CREDIT_NORMAL_TYPES = ['liability', 'equity', 'income'];

    /** Chart of accounts — the web app's "/add-account" page doubles as this list. Balance shown here uses the same sign convention as the Balance Sheet (positive = healthy). */
    public function accounts(Request $request)
    {
        $this->requireModule($request, 'accounting');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $accounts = LedgerAccount::withSum('entries as total_debit', 'debit')
            ->withSum('entries as total_credit', 'credit')
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        return response()->json($accounts->map(fn (LedgerAccount $a) => [
            'id' => $a->id,
            'name' => $a->name,
            'type' => $a->type,
            'openingBalance' => (float) $a->opening_balance,
            'balance' => $this->displayBalance($a, (float) ($a->total_debit ?? 0), (float) ($a->total_credit ?? 0)),
        ]));
    }

    /**
     * Manager+ only. The web app's Add Account form only offers 4 of the 5 real account
     * types in its dropdown (equity is missing, seemingly by oversight — the schema and
     * server action both fully support it) — this includes all five rather than
     * reproducing that gap. No opening-balance field here either way, matching the web
     * app's own real, deliberate design (new accounts always start at 0).
     */
    public function createAccount(Request $request)
    {
        $this->requireModule($request, 'accounting');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:asset,liability,equity,income,expense'],
        ]);

        if (trim($data['name']) === '') {
            throw ValidationException::withMessages(['name' => ['Account name is required.']]);
        }

        $exists = LedgerAccount::where('business_id', $businessId)->where('name', trim($data['name']))->exists();
        if ($exists) {
            throw ValidationException::withMessages(['name' => ['Account already exists!']]);
        }

        $account = LedgerAccount::create([
            'business_id' => $businessId,
            'name' => trim($data['name']),
            'type' => $data['type'],
            'opening_balance' => 0,
        ]);

        return response()->json(['message' => 'Account added successfully!', 'id' => $account->id], 201);
    }

    /** One account's full debit/credit history plus its running balance — the web app's "/ledger" page. */
    public function ledger(Request $request, LedgerAccount $ledgerAccount)
    {
        $this->requireModule($request, 'accounting');
        $this->requireManagerUp($request);

        if ($ledgerAccount->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $entries = LedgerEntry::where('account_id', $ledgerAccount->id)
            ->orderBy('entry_date')
            ->orderBy('id')
            ->get();

        $totalDebit = (float) $entries->sum('debit');
        $totalCredit = (float) $entries->sum('credit');

        return response()->json([
            'account' => ['id' => $ledgerAccount->id, 'name' => $ledgerAccount->name, 'type' => $ledgerAccount->type],
            'entries' => $entries->map(fn (LedgerEntry $e) => [
                'date' => $e->entry_date->toDateString(),
                'description' => $e->description,
                'debit' => (float) $e->debit,
                'credit' => (float) $e->credit,
            ]),
            'totalDebit' => $totalDebit,
            'totalCredit' => $totalCredit,
            'balance' => $this->displayBalance($ledgerAccount, $totalDebit, $totalCredit),
        ]);
    }

    private function displayBalance(LedgerAccount $account, float $totalDebit, float $totalCredit): float
    {
        $raw = (float) $account->opening_balance + $totalDebit - $totalCredit;

        return in_array($account->type, self::CREDIT_NORMAL_TYPES, true) ? -$raw : $raw;
    }

    public function trialBalance(Request $request)
    {
        $this->requireModule($request, 'accounting');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $accounts = LedgerAccount::withSum('entries as total_debit', 'debit')
            ->withSum('entries as total_credit', 'credit')
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        $rows = $accounts->map(fn (LedgerAccount $a) => [
            'id' => $a->id,
            'name' => $a->name,
            'type' => $a->type,
            'debit' => (float) ($a->total_debit ?? 0),
            'credit' => (float) ($a->total_credit ?? 0),
        ]);

        $totalDebit = (float) $rows->sum('debit');
        $totalCredit = (float) $rows->sum('credit');

        return response()->json([
            'accounts' => $rows,
            'totalDebit' => $totalDebit,
            'totalCredit' => $totalCredit,
            'balanced' => abs($totalDebit - $totalCredit) < 1,
        ]);
    }

    public function balanceSheet(Request $request)
    {
        $this->requireModule($request, 'accounting');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $accounts = LedgerAccount::withSum('entries as total_debit', 'debit')
            ->withSum('entries as total_credit', 'credit')
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        $rows = $accounts->map(fn (LedgerAccount $a) => [
            'id' => $a->id,
            'name' => $a->name,
            'type' => $a->type,
            'balance' => $this->displayBalance($a, (float) ($a->total_debit ?? 0), (float) ($a->total_credit ?? 0)),
        ]);

        $byType = fn (string $type) => $rows->where('type', $type)->values();

        $totalAssets = (float) $byType('asset')->sum('balance');
        $totalLiabilities = (float) $byType('liability')->sum('balance');
        $totalIncome = (float) $byType('income')->sum('balance');
        $totalExpense = (float) $byType('expense')->sum('balance');
        $netIncome = $totalIncome - $totalExpense;
        $totalEquity = (float) $byType('equity')->sum('balance') + $netIncome;

        return response()->json([
            'assets' => $byType('asset'),
            'liabilities' => $byType('liability'),
            'equity' => $byType('equity'),
            'incomeAccounts' => $byType('income'),
            'expenseAccounts' => $byType('expense'),
            'totalAssets' => $totalAssets,
            'totalLiabilities' => $totalLiabilities,
            'totalEquity' => $totalEquity,
            'retainedEarnings' => $netIncome,
            'balanced' => abs($totalAssets - ($totalLiabilities + $totalEquity)) < 1,
        ]);
    }

    /**
     * The cost-of-sales version — real revenue/COGS/gross-profit/net-profit, sourced
     * straight from sales and product buying prices rather than the ledger. The web app
     * actually built this exact computation but never wired it to any page (it shows a
     * much thinner income-minus-expenses figure instead); this port uses the real one.
     */
    public function incomeStatement(Request $request)
    {
        $this->requireModule($request, 'accounting');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $days = $request->integer('days') ?: 30;
        $since = now()->subDays($days - 1)->startOfDay();

        $salesTotals = Sale::where('business_id', $businessId)->where('sold_at', '>=', $since)
            ->selectRaw("coalesce(sum(total) filter (where status != 'refunded'), 0) as revenue, coalesce(sum(total) filter (where status = 'refunded'), 0) as refunds")
            ->first();
        $revenue = (float) $salesTotals->revenue;
        $refunds = (float) $salesTotals->refunds;

        $costOfSales = (float) DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.business_id', $businessId)
            ->where('sales.sold_at', '>=', $since)
            ->where('sales.status', '!=', 'refunded')
            ->selectRaw('coalesce(sum(products.buying_price * sale_items.quantity), 0) as v')
            ->value('v');

        $grossProfit = $revenue - $costOfSales;

        $expensesByCategory = Expense::where('business_id', $businessId)
            ->where('incurred_on', '>=', $since->toDateString())
            ->select('category')
            ->selectRaw('coalesce(sum(amount), 0) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $totalExpenses = (float) $expensesByCategory->sum('total');
        $netProfit = $grossProfit - $totalExpenses;

        return response()->json([
            'days' => $days,
            'revenue' => $revenue,
            'refunds' => $refunds,
            'costOfSales' => $costOfSales,
            'grossProfit' => $grossProfit,
            'expensesByCategory' => $expensesByCategory->map(fn ($e) => ['category' => $e->category, 'amount' => (float) $e->total])->values(),
            'totalExpenses' => $totalExpenses,
            'netProfit' => $netProfit,
        ]);
    }

    private function requireManagerUp(Request $request): void
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can view accounting reports.');
        }
    }
}
