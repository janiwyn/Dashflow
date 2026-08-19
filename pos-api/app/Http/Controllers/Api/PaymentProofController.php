<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\PaymentProof;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PaymentProofController extends Controller
{
    use ScopesTenant;

    /** Base64 image text can run ~1.37x the original byte size — same ceiling the web app enforces. */
    const MAX_IMAGE_DATA_URL_LENGTH = 2 * 1024 * 1024 * 1.4;

    private function methodLabel(string $method): string
    {
        return $method === 'mtn_merchant' ? 'MTN Merchant' : 'Airtel Merchant';
    }

    private function statusLabel(string $status): string
    {
        return ucfirst($status);
    }

    public function index(Request $request)
    {
        $this->requireModule($request, 'sales');
        $branchId = $this->enforcedBranchId($request, $request->integer('branch_id') ?: null);

        $proofs = PaymentProof::with('branch')
            ->where('business_id', $this->businessId($request))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('submitted_at')
            ->limit(100)
            ->get();

        return response()->json($proofs->map(fn (PaymentProof $p) => [
            'id' => $p->id,
            'ref' => $p->reference,
            'branch' => $p->branch->name ?? null,
            'customer' => $p->customer_name,
            'phone' => $p->phone,
            'location' => $p->location,
            'method' => $this->methodLabel($p->method),
            'status' => $this->statusLabel($p->status),
            'imagePath' => $p->image_path,
            'date' => $p->submitted_at->toIso8601String(),
        ]));
    }

    /** Any signed-in role can log a proof — screenshots arrive over WhatsApp/SMS and staff enters them. */
    public function store(Request $request)
    {
        $this->requireModule($request, 'sales');

        $data = $request->validate([
            'reference' => ['required', 'string', 'max:255'],
            'customer_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'method' => ['required', 'in:mtn_merchant,airtel_merchant'],
            'branch_id' => ['nullable', 'integer'],
            'image_data_url' => ['required', 'string'],
        ]);

        if (! str_starts_with($data['image_data_url'], 'data:image/')) {
            throw ValidationException::withMessages(['image_data_url' => ['Attach a screenshot image.']]);
        }
        if (strlen($data['image_data_url']) > self::MAX_IMAGE_DATA_URL_LENGTH) {
            throw ValidationException::withMessages(['image_data_url' => ['Image is too large — keep it under 2MB.']]);
        }

        $branchId = $this->enforcedBranchId($request, $data['branch_id'] ?? null);

        PaymentProof::create([
            'business_id' => $this->businessId($request),
            'reference' => trim($data['reference']),
            'branch_id' => $branchId,
            'customer_name' => trim($data['customer_name']),
            'phone' => trim($data['phone'] ?? '') ?: null,
            'location' => trim($data['location'] ?? '') ?: null,
            'method' => $data['method'],
            'status' => 'pending',
            'image_path' => $data['image_data_url'],
            'submitted_at' => now(),
        ]);

        return response()->json(['message' => 'Payment proof logged for review.'], 201);
    }

    /** Only manager/admin/super can verify or reject — matches the web app's requireRole() gate exactly. */
    public function review(Request $request, PaymentProof $paymentProof)
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can verify or reject payment proofs.');
        }
        if ($paymentProof->business_id !== $this->businessId($request)) {
            abort(404);
        }

        $data = $request->validate(['status' => ['required', 'in:verified,rejected']]);

        $paymentProof->update(['status' => $data['status'], 'reviewed_by_id' => $user->id]);

        return response()->json([
            'message' => $data['status'] === 'verified' ? 'Payment proof verified.' : 'Payment proof rejected.',
        ]);
    }
}
