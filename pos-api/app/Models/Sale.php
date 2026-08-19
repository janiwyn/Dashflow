<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $table = 'sales';

    /** The `sales` table only has `created_at`, no `updated_at` — sales are never edited after the fact. */
    const UPDATED_AT = null;

    protected $fillable = [
        'business_id', 'branch_id', 'reference', 'customer_id', 'customer_name',
        'cashier_id', 'cashier_name', 'method', 'status', 'subtotal', 'tax_rate',
        'tax_amount', 'total', 'amount_paid', 'due_date', 'sold_at',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'tax_amount' => 'float',
        'total' => 'float',
        'amount_paid' => 'float',
        'sold_at' => 'datetime',
        'due_date' => 'date',
    ];

    public function items()
    {
        return $this->hasMany(SaleItem::class, 'sale_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
