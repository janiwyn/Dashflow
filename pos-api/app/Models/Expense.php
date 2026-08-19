<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $table = 'expenses';

    protected $fillable = [
        'business_id', 'branch_id', 'reference', 'label', 'category',
        'amount', 'incurred_on', 'handled_by_id',
    ];

    protected $casts = ['amount' => 'float', 'incurred_on' => 'date'];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
