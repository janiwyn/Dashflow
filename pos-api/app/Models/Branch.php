<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $table = 'branches';

    public $timestamps = true;

    protected $fillable = ['business_id', 'name', 'location', 'contact', 'manager_name', 'status'];

    public function business()
    {
        return $this->belongsTo(Business::class, 'business_id');
    }
}
