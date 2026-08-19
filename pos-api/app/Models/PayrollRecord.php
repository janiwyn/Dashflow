<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollRecord extends Model
{
    protected $table = 'payroll_records';

    protected $fillable = [
        'employee_id', 'month', 'base_salary', 'transport', 'housing', 'medical', 'overtime',
        'nssf', 'tax', 'loan', 'other_deductions', 'gross', 'net', 'status',
    ];

    protected $casts = [
        'base_salary' => 'float', 'transport' => 'float', 'housing' => 'float',
        'medical' => 'float', 'overtime' => 'float', 'nssf' => 'float', 'tax' => 'float',
        'loan' => 'float', 'other_deductions' => 'float', 'gross' => 'float', 'net' => 'float',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
