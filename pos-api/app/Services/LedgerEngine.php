<?php

namespace App\Services;

use App\Models\CashBookEntry;
use App\Models\LedgerAccount;
use App\Models\LedgerEntry;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

/**
 * Ports the web app's ledger-engine.ts — real double-entry postings triggered by real
 * business events (never a manual journal entry; the web app never built one of those
 * either). Each event writes to three places: the double-entry ledger (for Trial Balance
 * / Balance Sheet), the flat Transactions feed, and the Cash Book — same three-table
 * fan-out the web app does, but wrapped in a single DB transaction per event so a partial
 * failure can't leave an unbalanced ledger (the web app's version has no such wrapper).
 *
 * One deliberate addition beyond the web app: recordDebtorPayment(). The web app never
 * wires debtor repayments into accounting at all — real cash comes in and it's invisible
 * to the cash book, trial balance, and income statement. That's a genuine gap, not a
 * design choice, so it's closed here.
 */
class LedgerEngine
{
    public static function resolveAccount(int $businessId, string $name, string $type): LedgerAccount
    {
        return LedgerAccount::firstOrCreate(
            ['business_id' => $businessId, 'name' => $name],
            ['type' => $type, 'opening_balance' => 0],
        );
    }

    private static function post(int $businessId, string $debitAccount, string $debitType, string $creditAccount, string $creditType, float $amount, string $description): void
    {
        $date = now()->toDateString();
        $debit = self::resolveAccount($businessId, $debitAccount, $debitType);
        $credit = self::resolveAccount($businessId, $creditAccount, $creditType);

        LedgerEntry::create(['account_id' => $debit->id, 'entry_date' => $date, 'description' => $description, 'debit' => $amount, 'credit' => 0]);
        LedgerEntry::create(['account_id' => $credit->id, 'entry_date' => $date, 'description' => $description, 'debit' => 0, 'credit' => $amount]);
    }

    private static function feed(int $businessId, ?int $branchId, string $type, string $description, float $amount, ?string $userId, ?string $userName): void
    {
        Transaction::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'entry_date' => now()->toDateString(),
            'type' => $type,
            'description' => $description,
            'amount' => $amount,
            'handled_by_id' => $userId,
            'handled_by_name' => $userName,
        ]);
    }

    private static function cashBook(int $businessId, string $particulars, string $source, float $cashIn = 0, float $bankIn = 0, float $cashOut = 0, float $bankOut = 0): void
    {
        CashBookEntry::create([
            'business_id' => $businessId,
            'entry_date' => now()->toDateString(),
            'particulars' => $particulars,
            'cash_in' => $cashIn, 'bank_in' => $bankIn, 'cash_out' => $cashOut, 'bank_out' => $bankOut,
            'source' => $source,
        ]);
    }

    /** A till sale or a fulfilled remote order. */
    public static function recordSale(int $businessId, ?int $branchId, float $amount, string $method, string $description, ?string $userId, ?string $userName): void
    {
        if ($amount <= 0) {
            return;
        }

        DB::transaction(function () use ($businessId, $branchId, $amount, $method, $description, $userId, $userName) {
            self::post($businessId, 'Cash in Hand', 'asset', 'Sales Revenue', 'income', $amount, $description);
            self::feed($businessId, $branchId, 'income', $description, $amount, $userId, $userName);
            self::cashBook(
                $businessId, $description, 'Sale',
                cashIn: $method === 'cash' ? $amount : 0,
                bankIn: $method === 'cash' ? 0 : $amount,
            );
        });
    }

    /** Receiving a purchase order — cash/bank pays it off immediately, credit adds to Accounts Payable. */
    public static function recordPurchase(int $businessId, ?int $branchId, float $amount, string $method, string $description, ?string $userId, ?string $userName): void
    {
        if ($amount <= 0) {
            return;
        }

        DB::transaction(function () use ($businessId, $branchId, $amount, $method, $description, $userId, $userName) {
            if ($method === 'credit') {
                self::post($businessId, 'Inventory', 'asset', 'Accounts Payable', 'liability', $amount, "{$description} (on credit)");
            } else {
                self::post($businessId, 'Inventory', 'asset', 'Cash in Hand', 'asset', $amount, "{$description} (paid)");
                self::cashBook(
                    $businessId, $description, 'Purchase',
                    cashOut: $method === 'cash' ? $amount : 0,
                    bankOut: $method === 'cash' ? 0 : $amount,
                );
            }
            self::feed($businessId, $branchId, 'expense', $description.($method === 'credit' ? ' (on credit)' : ' (paid)'), $amount, $userId, $userName);
        });
    }

    /** Paying down a supplier's payable balance. */
    public static function recordSupplierPayment(int $businessId, ?int $branchId, float $amount, string $description, ?string $userId, ?string $userName): void
    {
        if ($amount <= 0) {
            return;
        }

        DB::transaction(function () use ($businessId, $branchId, $amount, $description, $userId, $userName) {
            self::post($businessId, 'Accounts Payable', 'liability', 'Cash in Hand', 'asset', $amount, $description);
            self::feed($businessId, $branchId, 'expense', $description, $amount, $userId, $userName);
            self::cashBook($businessId, $description, 'Supplier payment', cashOut: $amount);
        });
    }

    /** A logged business expense — always paid from Cash in Hand, same simplification the web app makes (no payment-method field exists on expenses there either). */
    public static function recordExpense(int $businessId, ?int $branchId, string $category, float $amount, string $description, ?string $userId, ?string $userName): void
    {
        if ($amount <= 0) {
            return;
        }

        $accountName = str_ends_with(strtolower(trim($category)), 'expense') ? trim($category) : trim($category).' Expense';

        DB::transaction(function () use ($businessId, $branchId, $accountName, $amount, $description, $userId, $userName) {
            self::post($businessId, $accountName, 'expense', 'Cash in Hand', 'asset', $amount, $description);
            self::feed($businessId, $branchId, 'expense', $description, $amount, $userId, $userName);
            self::cashBook($businessId, $description, 'Expenses', cashOut: $amount);
        });
    }

    /**
     * A new debtor record — goods handed over on credit. Without this, Debtors
     * Receivable would only ever get credited (by repayments) and never debited,
     * drifting permanently negative. Modeled as a credit sale: the goods are treated as
     * sold now, just not yet paid for.
     */
    public static function recordDebtExtended(int $businessId, ?int $branchId, float $amount, string $description, ?string $userId, ?string $userName): void
    {
        if ($amount <= 0) {
            return;
        }

        DB::transaction(function () use ($businessId, $branchId, $amount, $description, $userId, $userName) {
            self::post($businessId, 'Debtors Receivable', 'asset', 'Sales Revenue', 'income', $amount, $description);
            self::feed($businessId, $branchId, 'income', $description, $amount, $userId, $userName);
        });
    }

    /**
     * A debtor repaying what they owe — genuinely wired here, unlike the web app, where
     * this real cash movement never reaches accounting at all.
     */
    public static function recordDebtorPayment(int $businessId, ?int $branchId, float $amount, string $description, ?string $userId, ?string $userName): void
    {
        if ($amount <= 0) {
            return;
        }

        DB::transaction(function () use ($businessId, $branchId, $amount, $description, $userId, $userName) {
            self::post($businessId, 'Cash in Hand', 'asset', 'Debtors Receivable', 'asset', $amount, $description);
            self::feed($businessId, $branchId, 'income', $description, $amount, $userId, $userName);
            self::cashBook($businessId, $description, 'Debtor payment', cashIn: $amount);
        });
    }
}
