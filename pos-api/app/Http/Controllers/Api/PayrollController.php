<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Employee;
use App\Models\PayrollRecord;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PayrollController extends Controller
{
    use ScopesTenant;

    /**
     * Manager/admin/super get the full business-wide management view — matching the
     * web app's role-only gate on /payroll — regardless of whether they also happen to
     * have their own linked employee record (a working manager shouldn't lose the
     * management tools just because they're also on the payroll). Staff always see only
     * their own payslips via their linked employee record.
     */
    public function index(Request $request)
    {
        $this->requireModule($request, 'payroll');

        $user = $this->authUser($request);
        $isManagerUp = in_array($user->role, ['super', 'admin', 'manager'], true);
        $myEmployee = Employee::where('business_id', $user->business_id)->where('user_id', $user->id)->first();

        $query = PayrollRecord::with('employee')->orderByDesc('id')->limit(30);

        if ($isManagerUp) {
            $query->whereHas('employee', fn ($q) => $q->where('business_id', $user->business_id));
        } else {
            $query->where('employee_id', $myEmployee->id ?? -1);
        }

        $records = $query->get();

        return response()->json([
            'scope' => $isManagerUp ? 'business' : 'mine',
            'records' => $records->map(fn (PayrollRecord $r) => [
                'id' => $r->id,
                'employeeId' => $r->employee_id,
                'employee' => $r->employee->name ?? '—',
                'month' => $r->month,
                'gross' => (float) $r->gross,
                'net' => (float) $r->net,
                'status' => $r->status,
            ]),
        ]);
    }

    /** Manager+ only. Active employees only, skips anyone who already has a record for the month — matches the web app's generateMonthlyPayroll() exactly, including leaving already-existing records untouched even if base salary has since changed. */
    public function generate(Request $request)
    {
        $this->requireModule($request, 'payroll');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $data = $request->validate(['month' => ['required', 'regex:/^\d{4}-\d{2}$/']]);
        $month = $data['month'];

        $activeEmployees = Employee::where('business_id', $businessId)->where('status', 'active')->get(['id', 'base_salary']);
        if ($activeEmployees->isEmpty()) {
            throw ValidationException::withMessages(['month' => ['No active employees to run payroll for.']]);
        }

        $existingIds = PayrollRecord::whereIn('employee_id', $activeEmployees->pluck('id'))
            ->where('month', $month)
            ->pluck('employee_id');

        $toCreate = $activeEmployees->reject(fn (Employee $e) => $existingIds->contains($e->id));

        if ($toCreate->isEmpty()) {
            return response()->json(['message' => "Every active employee already has a payroll record for {$month}.", 'created' => 0]);
        }

        foreach ($toCreate as $e) {
            $baseSalary = (float) $e->base_salary;
            PayrollRecord::create([
                'employee_id' => $e->id,
                'month' => $month,
                'base_salary' => $baseSalary,
                'transport' => 0, 'housing' => 0, 'medical' => 0, 'overtime' => 0,
                'nssf' => 0, 'tax' => 0, 'loan' => 0, 'other_deductions' => 0,
                'gross' => $baseSalary,
                'net' => $baseSalary,
                'status' => 'pending',
            ]);
        }

        $count = $toCreate->count();

        return response()->json([
            'message' => "Generated {$count} payroll record".($count === 1 ? '' : 's')." for {$month}.",
            'created' => $count,
        ]);
    }

    /**
     * Manager+ only. A true upsert on (employee_id, month), matching the web app's
     * onConflictDoUpdate — including that resaving an already-paid record's allowances
     * does NOT reset its status back to pending (status is simply never touched here).
     */
    public function upsert(Request $request)
    {
        $this->requireModule($request, 'payroll');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $data = $request->validate([
            'employee_id' => ['required', 'integer'],
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'transport' => ['nullable', 'numeric', 'min:0'],
            'housing' => ['nullable', 'numeric', 'min:0'],
            'medical' => ['nullable', 'numeric', 'min:0'],
            'overtime' => ['nullable', 'numeric', 'min:0'],
            'nssf' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'loan' => ['nullable', 'numeric', 'min:0'],
            'other_deductions' => ['nullable', 'numeric', 'min:0'],
        ]);

        $employee = Employee::where('business_id', $businessId)->where('id', $data['employee_id'])->first();
        if (! $employee) {
            throw ValidationException::withMessages(['employee_id' => ['Employee not found.']]);
        }

        $baseSalary = (float) $employee->base_salary;
        $transport = $data['transport'] ?? 0;
        $housing = $data['housing'] ?? 0;
        $medical = $data['medical'] ?? 0;
        $overtime = $data['overtime'] ?? 0;
        $nssf = $data['nssf'] ?? 0;
        $tax = $data['tax'] ?? 0;
        $loan = $data['loan'] ?? 0;
        $other = $data['other_deductions'] ?? 0;

        $gross = $baseSalary + $transport + $housing + $medical + $overtime;
        $net = $gross - ($nssf + $tax + $loan + $other);

        $attributes = [
            'base_salary' => $baseSalary, 'transport' => $transport, 'housing' => $housing,
            'medical' => $medical, 'overtime' => $overtime, 'nssf' => $nssf, 'tax' => $tax,
            'loan' => $loan, 'other_deductions' => $other, 'gross' => $gross, 'net' => $net,
        ];

        $existing = PayrollRecord::where('employee_id', $employee->id)->where('month', $data['month'])->first();
        if ($existing) {
            $existing->update($attributes);
        } else {
            PayrollRecord::create($attributes + ['employee_id' => $employee->id, 'month' => $data['month'], 'status' => 'pending']);
        }

        return response()->json(['message' => 'Payroll saved.']);
    }

    /** Manager+ only. No UI path ever reverts a record back to pending, same as the web app. */
    public function markPaid(Request $request, PayrollRecord $payrollRecord)
    {
        $this->requireModule($request, 'payroll');
        $this->requireManagerUp($request);

        if ($payrollRecord->employee?->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $payrollRecord->update(['status' => 'paid']);

        return response()->json(['message' => 'Payroll marked paid.']);
    }

    /**
     * A specific payslip. Unlike the web app — which gates this only on the module being
     * active, with no ownership check at all, so any staff member can view any other
     * employee's payslip simply by changing the id in the URL — a staff caller here may
     * only open their own linked record; manager+ may open any record in their business.
     */
    public function show(Request $request, PayrollRecord $payrollRecord)
    {
        $this->requireModule($request, 'payroll');
        $user = $this->authUser($request);
        $businessId = $this->businessId($request);

        $employee = $payrollRecord->employee;
        if (! $employee || $employee->business_id !== $businessId) {
            abort(404);
        }

        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            $myEmployee = Employee::where('business_id', $businessId)->where('user_id', $user->id)->first();
            if (! $myEmployee || $myEmployee->id !== $employee->id) {
                abort(403, 'You can only view your own payslip.');
            }
        }

        return response()->json($this->serializePayslip($payrollRecord, $employee));
    }

    private function requireManagerUp(Request $request): void
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can manage payroll.');
        }
    }

    private function serializePayslip(PayrollRecord $r, Employee $e): array
    {
        $business = Business::find($e->business_id);

        return [
            'id' => $r->id,
            'businessName' => $business->name ?? null,
            'currency' => $business->currency ?? 'KES',
            'employee' => [
                'name' => $e->name,
                'position' => $e->position,
                'email' => $e->email,
                'phone' => $e->phone,
                'branch' => $e->branch->name ?? null,
            ],
            'month' => $r->month,
            'status' => $r->status,
            'baseSalary' => (float) $r->base_salary,
            'transport' => (float) $r->transport,
            'housing' => (float) $r->housing,
            'medical' => (float) $r->medical,
            'overtime' => (float) $r->overtime,
            'gross' => (float) $r->gross,
            'nssf' => (float) $r->nssf,
            'tax' => (float) $r->tax,
            'loan' => (float) $r->loan,
            'otherDeductions' => (float) $r->other_deductions,
            'totalDeductions' => (float) ($r->nssf + $r->tax + $r->loan + $r->other_deductions),
            'net' => (float) $r->net,
        ];
    }
}
