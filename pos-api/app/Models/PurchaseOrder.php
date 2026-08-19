<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $table = 'purchase_orders';

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'supplier_id', 'reference', 'status', 'notes',
        'total_cost', 'ordered_at', 'received_at', 'created_by',
    ];

    protected $casts = [
        'total_cost' => 'float',
        'ordered_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class, 'purchase_order_id');
    }
}
