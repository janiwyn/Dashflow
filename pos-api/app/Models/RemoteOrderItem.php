<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RemoteOrderItem extends Model
{
    protected $table = 'remote_order_items';

    public $timestamps = false;

    protected $casts = [
        'unit_price' => 'float',
    ];

    public function order()
    {
        return $this->belongsTo(RemoteOrder::class, 'order_id');
    }
}
