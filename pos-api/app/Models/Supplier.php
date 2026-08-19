<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $table = 'suppliers';

    protected $fillable = [
        'business_id', 'name', 'category_id', 'contact', 'contact_person',
        'email', 'address', 'payment_terms', 'last_delivery', 'payable',
    ];

    protected $casts = ['payable' => 'float', 'last_delivery' => 'date'];

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'supplier_id');
    }
}
