<?php

namespace App\Jobs;

use App\Helpers\ChargeHelper;
use App\Models\InvitationGroup;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AttemptUsageCharge implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels, Queueable;

    protected User $shop;
    protected InvitationGroup $invitationGroup;

    public function __construct(User $shop, InvitationGroup $invitationGroup)
    {
        $this->shop = $shop;
        $this->invitationGroup = $invitationGroup;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ($this->shop->development_store) {
            return;
        }

        $plan = $this->shop->plan;
        $charge = $this->shop->charges()->where('status', 'ACTIVE')->first();

        if (!$charge || !$plan) return;

        $activatedDate = $charge['activated_on'] ?? null;

        if (!$activatedDate) return;

        $from = Carbon::parse(date('Y-m-d', strtotime($activatedDate)));
        $to = Carbon::now();

        if ($from->diffInDays($to) > 30 && $this->shop->plan_limit_status > 0) {
            $this->shop->plan_limit_status = ChargeHelper::planLimitStatus('full_limit');
            $this->shop->save();
        }

        ChargeHelper::chargeAttemptForGroups($this->shop, $charge, $plan, $this->invitationGroup->id);
    }
}
