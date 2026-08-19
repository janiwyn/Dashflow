<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsLog extends Model
{
    protected $table = 'sms_logs';

    public $timestamps = false;

    protected $fillable = ['business_id', 'recipient', 'message', 'status', 'sent_at'];

    protected $casts = [
        'sent_at' => 'datetime',
    ];
}
