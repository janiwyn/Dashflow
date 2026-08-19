<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ScopesTenant;
use App\Http\Controllers\Controller;
use App\Models\SmsLog;
use App\Services\AliesmsClient;
use Illuminate\Http\Request;

/**
 * Ports the web app's "/sms" (sidebar label "SMS centre", page title "SMS
 * alerts" — the web app itself uses both strings for the same feature,
 * replicated here rather than "fixed" since the user asked for literal
 * parity). Core feature, no subscription module gate, manager+ only.
 *
 * One deliberate tightening: the web app only role-checks the send action
 * (sendSmsAlert → requireRole) — the page itself has no guard, so a staff
 * user hitting /sms directly still sees the full delivery log, just can't
 * send. Gated here on the read side too, consistent with every other
 * manager-only surface already built in this port.
 *
 * sms_logs has no branch_id column at all in the shared schema — this is a
 * business-wide feature by design there, not a scoping bug, so no branch
 * filtering is applied here either.
 */
class SmsController extends Controller
{
    use ScopesTenant;

    public function index(Request $request)
    {
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $logs = SmsLog::where('business_id', $businessId)->orderByDesc('sent_at')->get();

        return response()->json([
            'configured' => AliesmsClient::configured(),
            'logs' => $logs->map(fn (SmsLog $l) => [
                'id' => $l->id, 'recipient' => $l->recipient, 'message' => $l->message,
                'status' => $l->status, 'sentAt' => $l->sent_at->toIso8601String(),
            ]),
        ]);
    }

    public function send(Request $request)
    {
        $this->requireManagerUp($request);
        $businessId = $this->businessId($request);

        $data = $request->validate([
            'recipients' => ['required', 'array', 'min:1'],
            'recipients.*' => ['string'],
            'message' => ['required', 'string'],
        ]);

        $recipients = collect($data['recipients'])->map(fn ($r) => trim($r))->filter()->unique()->values()->all();
        $message = trim($data['message']);

        if (empty($recipients)) {
            return response()->json(['message' => 'Add at least one recipient.'], 422);
        }
        if ($message === '') {
            return response()->json(['message' => "Message can't be empty."], 422);
        }

        if (! AliesmsClient::configured()) {
            foreach ($recipients as $recipient) {
                SmsLog::create(['business_id' => $businessId, 'recipient' => $recipient, 'message' => $message, 'status' => 'failed', 'sent_at' => now()]);
            }

            return response()->json(['message' => "AlieSMS isn't set up for this business yet — an administrator needs to add the API credentials."], 422);
        }

        $result = AliesmsClient::sendBatch('Dashflow '.now()->toDateString(), $message, $recipients);

        $invalid = collect($result['ok'] ? $result['invalidNumbers'] : [])->flip();
        foreach ($recipients as $recipient) {
            SmsLog::create([
                'business_id' => $businessId, 'recipient' => $recipient, 'message' => $message,
                'status' => ($result['ok'] && ! $invalid->has($recipient)) ? 'sent' : 'failed',
                'sent_at' => now(),
            ]);
        }

        if (! $result['ok']) {
            return response()->json(['message' => $result['error']], 422);
        }

        $delivered = $result['totalRecipients'] - count($result['invalidNumbers']);
        if (count($result['invalidNumbers']) > 0) {
            $message = "Sent to {$delivered} of {$result['totalRecipients']} — ".implode(', ', $result['invalidNumbers']).' invalid.';
        } else {
            $message = "Sent to {$delivered} recipient".($delivered === 1 ? '' : 's').'.';
        }

        return response()->json(['message' => $message]);
    }

    private function requireManagerUp(Request $request): void
    {
        $user = $this->authUser($request);
        if (! in_array($user->role, ['super', 'admin', 'manager'], true)) {
            abort(403, 'Only managers and admins can access the SMS centre.');
        }
    }
}
