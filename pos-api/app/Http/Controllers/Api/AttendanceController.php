<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Self-service clock in/out from the phone — the employee IS the phone owner,
 * so unlike the kiosk/WebAuthn flow on the web app, identity is already
 * established by the bearer token. Method is always "self". This controller
 * also ports the web app's manager-facing Today's board, History, kiosk PIN
 * clock-in and manual correction — everything except the Schedule (shift
 * templates/roster) tab and WebAuthn biometric clock-in, which are separate,
 * much larger features left for a later pass.
 */
class AttendanceController extends Controller
{
    use ScopesTenant;

    /** Falls back to a flat 9am cutoff — the web app has no per-shift schedule data ported here, so every employee uses this fallback (matches its own no-shift-assigned behavior). */
    const LATE_CUTOFF_HOUR = 9;

    private function myEmployee(Request $request): Employee
    {
        $this->requireModule($request, 'attendance');

        $user = $this->authUser($request);
        $employee = Employee::where('business_id', $user->business_id)->where('user_id', $user->id)->first();

        if (! $employee) {
            throw ValidationException::withMessages(['employee' => ['No employee record is linked to your account.']])->status(422);
        }

        return $employee;
    }

    public function today(Request $request)
    {
        $employee = $this->myEmployee($request);

        $record = AttendanceRecord::where('employee_id', $employee->id)
            ->where('date', now()->toDateString())
            ->first();

        return response()->json([
            'clockedIn' => (bool) $record?->clock_in,
            'clockedOut' => (bool) $record?->clock_out,
            'clockIn' => $record?->clock_in?->toIso8601String(),
            'clockOut' => $record?->clock_out?->toIso8601String(),
        ]);
    }

    public function clockIn(Request $request)
    {
        $employee = $this->myEmployee($request);
        $today = now()->toDateString();

        $record = AttendanceRecord::where('employee_id', $employee->id)->where('date', $today)->first();
        if ($record?->clock_in) {
            return response()->json(['message' => 'Already clocked in today.'], 422);
        }

        AttendanceRecord::updateOrCreate(
            ['employee_id' => $employee->id, 'date' => $today],
            ['business_id' => $employee->business_id, 'branch_id' => $employee->branch_id, 'clock_in' => now(), 'clock_in_method' => 'self'],
        );

        return response()->json(['message' => 'Clocked in.']);
    }

    public function clockOut(Request $request)
    {
        $employee = $this->myEmployee($request);
        $today = now()->toDateString();

        $record = AttendanceRecord::where('employee_id', $employee->id)->where('date', $today)->first();
        if (! $record?->clock_in) {
            return response()->json(['message' => 'You have not clocked in today.'], 422);
        }
        if ($record->clock_out) {
            return response()->json(['message' => 'Already clocked out today.'], 422);
        }

        $record->update(['clock_out' => now(), 'clock_out_method' => 'self']);

        return response()->json(['message' => 'Clocked out.']);
    }

    private function myLinkedEmployee(Request $request): ?Employee
    {
        $user = $this->authUser($request);

        return Employee::where('business_id', $user->business_id)->where('user_id', $user->id)->first();
    }

    /**
     * "Today's board" for managers+, automatically narrowed to just the caller's own row
     * for staff — mirrors the web app's staffOwnEmployeeIdRestriction() exactly.
     */
    public function board(Request $request)
    {
        $this->requireModule($request, 'attendance');
        $user = $this->authUser($request);
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $query = Employee::with('branch')
            ->where('business_id', $businessId)
            ->where('status', 'active')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        if ($user->role === 'staff') {
            $own = $this->myLinkedEmployee($request);
            $query->where('id', $own->id ?? -1);
        }

        $employees = $query->orderBy('name')->get();

        $today = now()->toDateString();
        $records = AttendanceRecord::whereIn('employee_id', $employees->pluck('id'))
            ->where('date', $today)
            ->get()
            ->keyBy('employee_id');

        $rows = $employees->map(function (Employee $e) use ($records) {
            $record = $records->get($e->id);

            return [
                'employeeId' => $e->id,
                'name' => $e->name,
                'position' => $e->position,
                'branch' => $e->branch->name ?? null,
                'status' => $this->statusFor($record),
                'clockIn' => $record?->clock_in?->toIso8601String(),
                'clockInMethod' => $record?->clock_in_method,
                'clockOut' => $record?->clock_out?->toIso8601String(),
                'clockOutMethod' => $record?->clock_out_method,
                'hasPin' => (bool) $e->pin_hash,
            ];
        })->values();

        $summary = [
            'present' => $rows->where('status', 'present')->count(),
            'late' => $rows->where('status', 'late')->count(),
            'notYet' => $rows->where('status', 'not_yet')->count(),
            'total' => $rows->count(),
        ];

        return response()->json(['rows' => $rows, 'summary' => $summary]);
    }

    private function statusFor(?AttendanceRecord $record): string
    {
        if (! $record?->clock_in) {
            return 'not_yet';
        }

        // clock_in is stored/cast in UTC — convert to the business's real local time before
        // comparing against a wall-clock cutoff (the web app compares in UTC directly, which
        // is wrong for any business not in UTC+0; not replicating that here).
        $local = $record->clock_in->clone()->setTimezone('Africa/Nairobi');
        $minutes = $local->hour * 60 + $local->minute;

        return $minutes >= self::LATE_CUTOFF_HOUR * 60 ? 'late' : 'present';
    }

    /** Up to 100 most recent records — real hours-worked, computed live from whatever timestamps ended up persisted (including manual corrections). */
    public function history(Request $request)
    {
        $this->requireModule($request, 'attendance');
        $user = $this->authUser($request);
        $businessId = $this->businessId($request);
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $query = AttendanceRecord::with('employee')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($request->integer('employee_id'), fn ($q, $id) => $q->where('employee_id', $id));

        if ($user->role === 'staff') {
            $own = $this->myLinkedEmployee($request);
            $query->where('employee_id', $own->id ?? -1);
        }

        $records = $query->orderByDesc('date')->orderByDesc('id')->limit(100)->get();

        return response()->json($records->map(fn (AttendanceRecord $r) => [
            'employeeId' => $r->employee_id,
            'employeeName' => $r->employee->name ?? '—',
            'date' => $r->date->toDateString(),
            'clockIn' => $r->clock_in?->toIso8601String(),
            'clockInMethod' => $r->clock_in_method,
            'clockOut' => $r->clock_out?->toIso8601String(),
            'clockOutMethod' => $r->clock_out_method,
            'hoursWorked' => ($r->clock_in && $r->clock_out) ? round($r->clock_in->diffInMinutes($r->clock_out) / 60, 1) : null,
            'note' => $r->note,
        ]));
    }

    /** Kiosk employee picker — matches the web app: only employees with a PIN already set are meaningfully selectable (filtered client-side, same as there). */
    public function roster(Request $request)
    {
        $this->requireModule($request, 'attendance');
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $employees = Employee::where('business_id', $this->businessId($request))
            ->where('status', 'active')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->get();

        return response()->json($employees->map(fn (Employee $e) => [
            'id' => $e->id,
            'name' => $e->name,
            'hasPin' => (bool) $e->pin_hash,
        ]));
    }

    /** Manager+ only — hashed the same way a login password would be, never stored in the clear. */
    public function setPin(Request $request, Employee $employee)
    {
        $this->requireModule($request, 'attendance');
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can set a kiosk PIN.');
        }
        if ($employee->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $data = $request->validate(['pin' => ['required', 'regex:/^\d{4,6}$/']]);

        $employee->update(['pin_hash' => Hash::make($data['pin'])]);

        return response()->json(['message' => 'Kiosk PIN set.']);
    }

    /**
     * Kiosk clock-in/out — any signed-in user can operate the shared device; identity is
     * proven by the selected employee's own PIN, exactly like the web app. No PIN attempt
     * lockout exists on the web app either, so none is added here.
     */
    public function pinClock(Request $request)
    {
        $this->requireModule($request, 'attendance');
        $businessId = $this->businessId($request);

        $data = $request->validate([
            'employee_id' => ['required', 'integer'],
            'pin' => ['required', 'string'],
        ]);

        $employee = Employee::where('business_id', $businessId)
            ->where('id', $data['employee_id'])
            ->where('status', 'active')
            ->first();

        if (! $employee) {
            throw ValidationException::withMessages(['employee_id' => ['Employee not found.']]);
        }
        if (! $employee->pin_hash) {
            throw ValidationException::withMessages(['pin' => ['No PIN set for this employee yet — ask a manager.']]);
        }
        if (! Hash::check($data['pin'], $employee->pin_hash)) {
            throw ValidationException::withMessages(['pin' => ['Incorrect PIN.']]);
        }

        return response()->json($this->punch($employee, 'pin'));
    }

    /** Shared clock state machine — one in/out cycle per employee per day, direction inferred from what's already on today's record. */
    private function punch(Employee $employee, string $method): array
    {
        $today = now()->toDateString();
        $record = AttendanceRecord::where('employee_id', $employee->id)->where('date', $today)->first();

        if (! $record) {
            AttendanceRecord::create([
                'business_id' => $employee->business_id,
                'branch_id' => $employee->branch_id,
                'employee_id' => $employee->id,
                'date' => $today,
                'clock_in' => now(),
                'clock_in_method' => $method,
            ]);

            return ['message' => "{$employee->name} clocked in.", 'action' => 'in'];
        }

        if (! $record->clock_out) {
            $record->update(['clock_out' => now(), 'clock_out_method' => $method]);

            return ['message' => "{$employee->name} clocked out.", 'action' => 'out'];
        }

        throw ValidationException::withMessages(['employee_id' => ["{$employee->name} already clocked in and out today."]]);
    }

    /**
     * Manual correction — manager+. The web app's own dialog doesn't prefill from the
     * existing record before overwriting, so a manager fixing just the clock-out time can
     * silently null out an already-recorded clock-in; the PWA form prefills from the current
     * record instead, so this same full-overwrite semantics never loses data in practice.
     * Also enforces branch scoping, which the web app's version doesn't.
     */
    public function correction(Request $request)
    {
        $this->requireModule($request, 'attendance');
        $businessId = $this->businessId($request);
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can make a manual correction.');
        }

        $data = $request->validate([
            'employee_id' => ['required', 'integer'],
            'date' => ['required', 'date'],
            'clock_in' => ['nullable', 'date_format:H:i'],
            'clock_out' => ['nullable', 'date_format:H:i'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $employee = Employee::where('business_id', $businessId)->where('id', $data['employee_id'])->first();
        if (! $employee) {
            abort(404);
        }

        $branchId = $this->enforcedBranchId($request);
        if ($branchId && $employee->branch_id !== $branchId) {
            abort(403, 'You can only correct attendance for your own branch.');
        }

        // "HH:MM" from a manager's <input type="time"> is naive local wall-clock time —
        // parse it as such, then normalize to UTC before it reaches Eloquent's datetime
        // cast. The cast formats a Carbon instance using ITS OWN timezone into a plain
        // "Y-m-d H:i:s" string with no offset, and Postgres (session timezone UTC) then
        // interprets that naive string as UTC — so a non-UTC Carbon object round-trips
        // to the wrong instant unless it's converted to UTC first.
        $clockIn = $data['clock_in'] ? Carbon::parse("{$data['date']} {$data['clock_in']}", 'Africa/Nairobi')->utc() : null;
        $clockOut = $data['clock_out'] ? Carbon::parse("{$data['date']} {$data['clock_out']}", 'Africa/Nairobi')->utc() : null;

        AttendanceRecord::updateOrCreate(
            ['employee_id' => $employee->id, 'date' => $data['date']],
            [
                'business_id' => $businessId,
                'branch_id' => $employee->branch_id,
                'clock_in' => $clockIn,
                'clock_out' => $clockOut,
                'clock_in_method' => $clockIn ? 'manual' : null,
                'clock_out_method' => $clockOut ? 'manual' : null,
                'note' => $data['note'] ?? null,
            ],
        );

        return response()->json(['message' => 'Attendance record saved.']);
    }
}
