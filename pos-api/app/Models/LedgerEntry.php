<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LedgerEntry extends Model
{
    protected $table = 'ledger_entries';

    public $timestamps = false;

    protected $fillable = ['account_id', 'entry_date', 'description', 'debit', 'credit'];

    protected $casts = [
        'entry_date' => 'date',
        'debit' => 'float',
        'credit' => 'float',
    ];

    public function account()
    {
        return $this->belongsTo(LedgerAccount::class, 'account_id');
    }
}
