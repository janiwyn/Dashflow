<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';

    public $timestamps = true;

    protected $fillable = [
        'business_id', 'branch_id', 'category_id', 'sku', 'name',
        'selling_price', 'buying_price', 'stock', 'low_stock_threshold',
        'expiry_date', 'image_path',
    ];

    protected $casts = [
        'selling_price' => 'float',
        'buying_price' => 'float',
        'expiry_date' => 'date',
    ];

    public function scopeExpiringWithin($query, int $days)
    {
        return $query->whereNotNull('expiry_date')->where('expiry_date', '<=', now()->addDays($days)->toDateString());
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock', '<=', 'low_stock_threshold');
    }
}
