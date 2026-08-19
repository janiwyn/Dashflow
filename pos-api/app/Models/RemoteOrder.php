<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RemoteOrder extends Model
{
    protected $table = 'remote_orders';

    protected $fillable = [
        'business_id', 'branch_id', 'reference', 'customer_id', 'customer_name',
        'phone', 'delivery_location', 'payment_method', 'amount', 'status', 'placed_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'placed_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(RemoteOrderItem::class, 'order_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
