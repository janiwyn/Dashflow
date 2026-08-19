<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $table = 'purchase_order_items';

    public $timestamps = false;

    protected $fillable = ['purchase_order_id', 'product_id', 'product_name', 'quantity', 'unit_cost', 'subtotal'];

    protected $casts = ['unit_cost' => 'float', 'subtotal' => 'float'];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }
}
