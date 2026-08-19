<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $table = 'transactions';

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'branch_id', 'entry_date', 'type', 'description',
        'amount', 'handled_by_id', 'handled_by_name',
    ];

    protected $casts = ['amount' => 'float', 'entry_date' => 'date'];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
