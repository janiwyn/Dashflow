<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $table = 'employees';

    protected $fillable = [
        'business_id', 'branch_id', 'user_id', 'name', 'email', 'phone',
        'position', 'base_salary', 'hire_date', 'status', 'pin_hash',
    ];

    protected $casts = ['base_salary' => 'float', 'hire_date' => 'date'];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function payroll()
    {
        return $this->hasMany(PayrollRecord::class, 'employee_id');
    }

    public function attendance()
    {
        return $this->hasMany(AttendanceRecord::class, 'employee_id');
    }
}
