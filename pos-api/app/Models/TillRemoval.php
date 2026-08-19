<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TillRemoval extends Model
{
    protected $table = 'till_removals';

    public $timestamps = false;

    protected $fillable = ['till_id', 'amount', 'approved_by_name', 'balance_after', 'removed_at'];

    protected $casts = [
        'amount' => 'float',
        'balance_after' => 'float',
        'removed_at' => 'datetime',
    ];

    public function till()
    {
        return $this->belongsTo(Till::class, 'till_id');
    }
}
