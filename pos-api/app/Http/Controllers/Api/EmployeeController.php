<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EmployeeController extends Controller
{
    use ScopesTenant;

    /**
     * Left unrestricted by role (like the web app's own list query) because Till
     * Management's staff-assignment picker also reads this endpoint — restricting it
     * to manager+ would silently empty that dropdown for staff creating a till.
     */
    public function index(Request $request)
    {
        $this->requireModule($request, 'hr');

        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $employees = Employee::with(['branch', 'user'])
            ->where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->get();

        return response()->json($employees->map(fn (Employee $e) => $this->serialize($e)));
    }

    /** A specific employee's record — the web app's own detail page has no way to open a particular employee (always defaults to the first alphabetically); this looks one up for real. */
    public function show(Request $request, Employee $employee)
    {
        $this->requireModule($request, 'hr');
        $this->scopeOrFail($request, $employee);

        return response()->json($this->serialize($employee->load(['branch', 'user'])));
    }

    /** Manager and up — matches the web app's createEmployee gate. */
    public function store(Request $request)
    {
        $this->requireModule($request, 'hr');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $data = $this->validated($request, false);

        $branchId = $this->enforcedBranchId($request, $data['branch_id'] ?? null);
        $userId = $this->resolveUserLink($businessId, $data['user_id'] ?? null);

        $employee = Employee::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'user_id' => $userId,
            'name' => trim($data['name']),
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'position' => trim($data['position']),
            'base_salary' => $data['base_salary'] ?? 0,
            'hire_date' => $data['hire_date'] ?? now()->toDateString(),
            'status' => $data['status'] ?? 'active',
        ]);

        return response()->json(['message' => "{$employee->name} added.", 'id' => $employee->id], 201);
    }

    /** Manager and up — matches the web app's updateEmployee gate (which exists there but, unlike here, is never actually called by any button). */
    public function update(Request $request, Employee $employee)
    {
        $this->requireModule($request, 'hr');
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);
        $this->scopeOrFail($request, $employee);

        $data = $this->validated($request, true);

        $updates = [];
        foreach (['name', 'position'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = trim($data[$field]);
            }
        }
        foreach (['email', 'phone'] as $field) {
            if (array_key_exists($field, $data)) {
                $updates[$field] = $data[$field] ? trim($data[$field]) : null;
            }
        }
        if (array_key_exists('base_salary', $data)) {
            $updates['base_salary'] = $data['base_salary'];
        }
        if (array_key_exists('status', $data)) {
            $updates['status'] = $data['status'];
        }
        if (array_key_exists('branch_id', $data)) {
            $updates['branch_id'] = $this->enforcedBranchId($request, $data['branch_id']);
        }
        if (array_key_exists('user_id', $data)) {
            $updates['user_id'] = $this->resolveUserLink($businessId, $data['user_id'], $employee->id);
        }

        $employee->update($updates);

        return response()->json(['message' => 'Employee updated.']);
    }

    /** Admin/super only — stricter than create/update, matching the web app exactly (managers can't delete). */
    public function destroy(Request $request, Employee $employee)
    {
        $this->requireModule($request, 'hr');

        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin'], true)) {
            abort(403, 'Only admins can remove an employee record.');
        }
        $this->scopeOrFail($request, $employee);

        $name = $employee->name;
        $employee->delete();

        return response()->json(['message' => "{$name} removed."]);
    }

    /**
     * Users with no employee row yet — the web app's "link an existing login" dropdown
     * actually uses the unfiltered user list (a real query for this exists there,
     * getUnlinkedUsers(), but nothing calls it), so today two employees could be linked
     * to the same login. This uses the correctly-filtered version.
     */
    public function unlinkedUsers(Request $request)
    {
        $this->requireModule($request, 'hr');
        $businessId = $this->businessId($request);

        $linkedIds = Employee::where('business_id', $businessId)->whereNotNull('user_id')->pluck('user_id');

        $users = User::where('business_id', $businessId)
            ->whereNotIn('id', $linkedIds)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json($users);
    }

    private function scopeOrFail(Request $request, Employee $employee): void
    {
        if ($employee->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $branchId = $this->enforcedBranchId($request);
        if ($branchId && $employee->branch_id !== $branchId) {
            abort(404);
        }
    }

    private function requireManagerUp(Request $request): void
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can manage employee records.');
        }
    }

    private function resolveUserLink(int $businessId, ?string $userId, ?int $exceptEmployeeId = null): ?string
    {
        if (! $userId) {
            return null;
        }

        $user = User::where('id', $userId)->where('business_id', $businessId)->first();
        if (! $user) {
            throw ValidationException::withMessages(['user_id' => ['Selected login not found.']]);
        }

        $alreadyLinked = Employee::where('user_id', $user->id)
            ->when($exceptEmployeeId, fn ($q) => $q->where('id', '!=', $exceptEmployeeId))
            ->exists();
        if ($alreadyLinked) {
            throw ValidationException::withMessages(['user_id' => ['That login is already linked to another employee.']]);
        }

        return $user->id;
    }

    private function validated(Request $request, bool $isUpdate): array
    {
        $rules = [
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'branch_id' => ['sometimes', 'nullable', 'integer'],
            'position' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'base_salary' => ['sometimes', 'numeric', 'min:0'],
            'hire_date' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'in:active,inactive'],
            'user_id' => ['sometimes', 'nullable', 'string'],
        ];

        $data = $request->validate($rules);

        if (array_key_exists('name', $data) && trim($data['name']) === '') {
            throw ValidationException::withMessages(['name' => ['Employee name is required.']]);
        }
        if (array_key_exists('position', $data) && trim($data['position']) === '') {
            throw ValidationException::withMessages(['position' => ['Position is required.']]);
        }

        return $data;
    }

    private function serialize(Employee $e): array
    {
        return [
            'id' => $e->id,
            'name' => $e->name,
            'email' => $e->email,
            'phone' => $e->phone,
            'branch' => $e->branch->name ?? 'Unassigned',
            'branchId' => $e->branch_id,
            'position' => $e->position,
            'baseSalary' => (float) $e->base_salary,
            'hireDate' => $e->hire_date?->toDateString(),
            'status' => $e->status,
            'userId' => $e->user_id,
            'linkedUserName' => $e->user->name ?? null,
            'linkedUserEmail' => $e->user->email ?? null,
            'hasPin' => (bool) $e->pin_hash,
        ];
    }
}
