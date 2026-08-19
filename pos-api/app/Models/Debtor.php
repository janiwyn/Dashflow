<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Debtor extends Model
{
    protected $table = 'debtors';

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'branch_id', 'name', 'phone', 'item_taken',
        'quantity', 'amount_paid', 'balance', 'due_date', 'recorded_at',
    ];

    protected $casts = [
        'amount_paid' => 'float',
        'balance' => 'float',
        'due_date' => 'datetime',
        'recorded_at' => 'datetime',
    ];

    public function payments()
    {
        return $this->hasMany(DebtorPayment::class, 'debtor_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
