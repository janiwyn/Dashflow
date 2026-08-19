<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Despite the `is_read` column, this table has never stored an actual
 * notification feed in the web app — it only ever records dismiss/snooze
 * suppressions (rows are always inserted with is_read=true). The real alert
 * content shown to the user is computed live from products/debtors/customers
 * on every request; see NotificationController.
 */
class Notification extends Model
{
    protected $table = 'notifications';

    /** No `updated_at` column — suppression rows are replaced via update, never touched otherwise. */
    const UPDATED_AT = null;

    protected $fillable = [
        'business_id', 'branch_id', 'kind', 'title', 'body',
        'reference_id', 'amount', 'due_date', 'is_read',
    ];

    protected $casts = [
        'amount' => 'float',
        'due_date' => 'datetime',
        'is_read' => 'boolean',
        'created_at' => 'datetime',
    ];
}
