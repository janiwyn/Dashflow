<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Presence = subscribed. Mirrors the Next.js app's business_modules table exactly — same source of truth. */
class BusinessModule extends Model
{
    protected $table = 'business_modules';

    public $timestamps = false;

    const ALL_KEYS = [
        'pos', 'inventory', 'sales', 'accounting', 'procurement', 'customers', 'hr', 'attendance', 'payroll',
    ];
}
