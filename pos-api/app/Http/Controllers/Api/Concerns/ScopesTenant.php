<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\AttendanceRecord;
use App\Models\BusinessModule;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Mirrors the Next.js app's businessScope()/enforcedBranchId() rules: every
 * query is scoped to the caller's business, and a manager/staff account can
 * never widen its view past the branch it's assigned to — only admin/super
 * see every branch.
 */
trait ScopesTenant
{
    protected function authUser(Request $request): User
    {
        return $request->attributes->get('authUser');
    }

    protected function businessId(Request $request): int
    {
        return $this->authUser($request)->business_id;
    }

    /** Null means "no branch restriction" (admin/super) — never widen a locked account's requested branch. */
    protected function enforcedBranchId(Request $request, ?int $requested = null): ?int
    {
        $user = $this->authUser($request);

        if ($user->isBranchLocked()) {
            return $user->branch_id;
        }

        return $requested;
    }

    /** @return array<string> */
    protected function activeModules(Request $request): array
    {
        $user = $this->authUser($request);
        if ($user->role === 'super') {
            return BusinessModule::ALL_KEYS;
        }

        return BusinessModule::where('business_id', $user->business_id)->pluck('module_key')->all();
    }

    /** Mirrors requireModule() — 403s if the business hasn't subscribed to any of the given modules. */
    protected function requireModule(Request $request, string ...$keys): void
    {
        $user = $this->authUser($request);
        if ($user->role === 'super') {
            return;
        }

        $active = $this->activeModules($request);
        if (empty(array_intersect($keys, $active))) {
            throw ValidationException::withMessages(['module' => ['Your business does not have this module enabled.']])
                ->status(403);
        }
    }

    /**
     * Mirrors assertClockedIn(): only actually gates anything when the
     * business has the attendance module active AND the caller is linked to
     * an employee record — an owner/admin with no employee row (or a
     * business with no attendance module) is never blocked from selling.
     */
    protected function assertClockedIn(Request $request): void
    {
        $user = $this->authUser($request);
        if (! in_array('attendance', $this->activeModules($request), true)) {
            return;
        }

        $employee = Employee::where('business_id', $user->business_id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();
        if (! $employee) {
            return;
        }

        $today = AttendanceRecord::where('employee_id', $employee->id)->where('date', now()->toDateString())->first();

        if (! $today?->clock_in) {
            throw ValidationException::withMessages(['clock' => ['Clock in on the Attendance page before making a sale.']])
                ->status(422);
        }
        if ($today->clock_out) {
            throw ValidationException::withMessages(['clock' => ["You're clocked out for today — clock in again on the Attendance page to keep selling."]])
                ->status(422);
        }
    }
}
