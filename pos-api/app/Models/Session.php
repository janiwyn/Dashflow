<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Maps to better-auth's `session` table — the source of truth for bearer tokens this API accepts. */
class Session extends Model
{
    protected $table = 'session';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = true;

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
