<?php

namespace App\Jobs;

use App\Models\Invitation;
use App\Models\InvitationGroup;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessInvitationGroupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels, Queueable;

    protected User $shop;
    protected InvitationGroup $invitationGroup;

    public function __construct(User $shop, InvitationGroup $invitationGroup)
    {
        $this->shop = $shop;
        $this->invitationGroup = $invitationGroup;
        $this->onQueue('invitations');
    }

    /**
     * @throws \Throwable
     */
    public function handle(): void
    {
        $queueIndex = $this->shop->id % 4;
        $queueIndex = "process_invitations_$queueIndex";

        Invitation::where('user_id', $this->shop->id)
            ->where('invitation_group_id', $this->invitationGroup->id)
            ->whereNotIn('status', [Invitation::STATUS_SENT, Invitation::STATUS_SKIPPED])
            ->chunkById(100, function (Collection $invitations, $chunkIndex) use($queueIndex) {

                ProcessInvitationGroupChunkJob::dispatch($this->shop->id, $this->invitationGroup->id, $invitations->pluck('id')->toArray())->onQueue($queueIndex);
            });
    }
}
