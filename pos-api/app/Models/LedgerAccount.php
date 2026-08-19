<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LedgerAccount extends Model
{
    protected $table = 'ledger_accounts';

    public $timestamps = false;

    protected $fillable = ['business_id', 'name', 'type', 'opening_balance'];

    protected $casts = ['opening_balance' => 'float'];

    public function entries()
    {
        return $this->hasMany(LedgerEntry::class, 'account_id');
    }
}
