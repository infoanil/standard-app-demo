<?php

namespace App\Console\Commands;

use App\Jobs\ProcessBulkOperationJob;
use App\Models\BulkOperation;
use App\Models\InvitationGroup;
use App\Models\User;
use Illuminate\Console\Command;

class PollBulkOperation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:poll-bulk-operation';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $shops = User::whereNotNull('password')->get();

        foreach ($shops as $shop) {
            $bulkOperation = BulkOperation::where('user_id', $shop->id)
                ->where('status', BulkOperation::STATUS_CREATED)
                ->where('type', BulkOperation::TYPE_CUSTOMERS)
                ->first();

            if ($bulkOperation) {
                ProcessBulkOperationJob::dispatch($shop, $bulkOperation->graphql_id);
            }

            $invitationGroups = InvitationGroup::where('user_id', $shop->id)
                ->where('status', InvitationGroup::STATUS_IN_PROGRESS)
                ->get();

            /** @var  InvitationGroup $invitationGroup */
            foreach ($invitationGroups as $invitationGroup) {
                $invitationGroup->updateStats();
            }
        }
    }
}
