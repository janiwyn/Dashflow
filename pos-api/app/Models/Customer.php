<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table = 'customers';

    protected $fillable = [
        'business_id', 'name', 'type', 'contact', 'email', 'preferred_payment_method',
    ];

    protected $casts = [
        'account_balance' => 'float',
        'amount_credited' => 'float',
        'opening_date' => 'date',
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class, 'customer_id');
    }
}
