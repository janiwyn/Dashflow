<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    protected $table = 'sale_items';

    public $timestamps = false;

    protected $fillable = ['sale_id', 'product_id', 'name', 'sku', 'quantity', 'unit_price'];

    protected $casts = [
        'unit_price' => 'float',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
