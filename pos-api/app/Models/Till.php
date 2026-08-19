<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Till extends Model
{
    protected $table = 'tills';

    protected $fillable = ['business_id', 'branch_id', 'name', 'staff_id', 'staff_name', 'phone', 'balance'];

    protected $casts = ['balance' => 'float'];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function removals()
    {
        return $this->hasMany(TillRemoval::class, 'till_id');
    }
}
