<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** No branch_id column exists on this table — the cash book is business-wide only, same as the web app. */
class CashBookEntry extends Model
{
    protected $table = 'cash_book_entries';

    public $timestamps = false;

    protected $fillable = ['business_id', 'entry_date', 'particulars', 'cash_in', 'bank_in', 'cash_out', 'bank_out', 'source'];

    protected $casts = [
        'entry_date' => 'date',
        'cash_in' => 'float',
        'bank_in' => 'float',
        'cash_out' => 'float',
        'bank_out' => 'float',
    ];
}
