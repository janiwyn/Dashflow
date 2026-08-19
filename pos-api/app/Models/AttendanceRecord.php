<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    protected $table = 'attendance_records';

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'branch_id', 'employee_id', 'date',
        'clock_in', 'clock_out', 'clock_in_method', 'clock_out_method', 'note',
    ];

    protected $casts = [
        'date' => 'date',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
