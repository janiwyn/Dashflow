<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    protected $table = 'businesses';

    public $timestamps = true;

    protected $fillable = ['name', 'tagline', 'phone', 'address', 'tax_pin', 'currency'];

    public function branches()
    {
        return $this->hasMany(Branch::class, 'business_id');
    }
}
