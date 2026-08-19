<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Maps to better-auth's `user` table (owned by the Next.js app's Drizzle
 * schema) — this API never writes credentials, it only reads the account a
 * validated session token belongs to.
 */
class User extends Model
{
    protected $table = 'user';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = true;

    protected $fillable = ['name', 'phone'];

    protected $hidden = [];

    protected function casts(): array
    {
        return [
            'email_verified' => 'boolean',
            'business_id' => 'integer',
            'branch_id' => 'integer',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class, 'business_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    /** Managers/staff are locked to their own branch; admin/super see the whole business. */
    public function isBranchLocked(): bool
    {
        return in_array($this->role, ['manager', 'staff'], true);
    }
}
