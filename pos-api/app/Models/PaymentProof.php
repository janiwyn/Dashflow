<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentProof extends Model
{
    protected $table = 'payment_proofs';

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'order_id', 'reference', 'branch_id', 'customer_name',
        'phone', 'location', 'method', 'status', 'image_path', 'submitted_at', 'reviewed_by_id',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
