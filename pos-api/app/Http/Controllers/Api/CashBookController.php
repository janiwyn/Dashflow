<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\CashBookEntry;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CashBookController extends Controller
{
    use ScopesTenant;

    /** Business-wide only — the underlying table has no branch column at all, same as the web app. */
    public function index(Request $request)
    {
        $this->requireModule($request, 'accounting');

        $entries = CashBookEntry::where('business_id', $this->businessId($request))
            ->orderBy('entry_date')
            ->orderBy('id')
            ->limit(100)
            ->get();

        return response()->json($entries->map(fn (CashBookEntry $e) => $this->serialize($e)));
    }

    /**
     * Manager+ only. A real manual cash-book entry — the web app's "Save Entry" button
     * here only ever updates local component state; it never reaches the database at
     * all, so a manager who thinks they've recorded a real cash count silently loses it
     * on refresh. This one actually persists.
     */
    public function store(Request $request)
    {
        $this->requireModule($request, 'accounting');

        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can add a cash book entry.');
        }

        $data = $request->validate([
            'particulars' => ['required', 'string', 'max:255'],
            'entry_date' => ['nullable', 'date'],
            'cash_in' => ['nullable', 'numeric', 'min:0'],
            'bank_in' => ['nullable', 'numeric', 'min:0'],
            'cash_out' => ['nullable', 'numeric', 'min:0'],
            'bank_out' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (trim($data['particulars']) === '') {
            throw ValidationException::withMessages(['particulars' => ['Particulars are required.']]);
        }

        $entry = CashBookEntry::create([
            'business_id' => $this->businessId($request),
            'entry_date' => $data['entry_date'] ?? now()->toDateString(),
            'particulars' => trim($data['particulars']),
            'cash_in' => $data['cash_in'] ?? 0,
            'bank_in' => $data['bank_in'] ?? 0,
            'cash_out' => $data['cash_out'] ?? 0,
            'bank_out' => $data['bank_out'] ?? 0,
            'source' => 'Manual Entry',
        ]);

        return response()->json(['message' => 'Cash book entry saved.'] + $this->serialize($entry), 201);
    }

    private function serialize(CashBookEntry $e): array
    {
        return [
            'id' => $e->id,
            'date' => $e->entry_date->toDateString(),
            'particulars' => $e->particulars,
            'cashIn' => (float) $e->cash_in,
            'bankIn' => (float) $e->bank_in,
            'cashOut' => (float) $e->cash_out,
            'bankOut' => (float) $e->bank_out,
            'source' => $e->source,
        ];
    }
}
