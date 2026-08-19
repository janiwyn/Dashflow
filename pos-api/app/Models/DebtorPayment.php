<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DebtorPayment extends Model
{
    protected $table = 'debtor_payments';

    public $timestamps = false;

    protected $fillable = ['debtor_id', 'amount', 'balance_after', 'recorded_by_id', 'paid_at'];

    protected $casts = [
        'amount' => 'float',
        'balance_after' => 'float',
        'paid_at' => 'datetime',
    ];
}
