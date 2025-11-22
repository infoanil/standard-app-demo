<?php

namespace App\Jobs;

use App\Helpers\InvitationHelper;
use App\Helpers\ShopifyHelper;
use App\Models\Customer;
use App\Models\Invitation;
use App\Models\InvitationGroup;
use App\Models\User;
use App\Services\ShopifyService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FetchSegmentCustomers implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels, Queueable;

    protected User $shop;
    protected InvitationGroup $invitationGroup;

    /**
     * Create a new job instance.
     */
    public function __construct($shop, InvitationGroup $invitationGroup)
    {
        $this->shop = $shop;
        $this->invitationGroup = $invitationGroup;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $shopifyService = new ShopifyService($this->shop);

        $totalCount = 0;
        $hasNextPage = false;
        $next = null;
        $counter = 0;
        $queries = [
            'segmentId' => $this->invitationGroup->segment_id,
            'first' => 220
        ];

        do {
            try {
                if ($next) {
                    $queries['after'] = $next;
                }

                $response = $shopifyService->getSegmentCustomers($queries);
                $response = json_decode(json_encode($response), true);

                if (data_get($response, 'errors')) {

                    sleep(5);
                    $response = $shopifyService->getSegmentCustomers($queries);
                    $response = json_decode(json_encode($response), true);

                    if (data_get($response, 'errors')) {
                        continue;
                    }
                }

                if (!$totalCount) {
                    $totalCount = data_get($response, 'body.data.customerSegmentMembers.totalCount');
                }

                $hasNextPage = data_get($response, 'body.data.customerSegmentMembers.pageInfo.hasNextPage');
                $next = data_get($response, 'body.data.customerSegmentMembers.pageInfo.endCursor');

                $customerIds = data_get($response, 'body.data.customerSegmentMembers.edges', []);
                $customerIds = collect($customerIds)->pluck('node.id')->map(function ($customerId) {
                    return getGraphqlId(getResourceId($customerId), ShopifyHelper::$CUSTOMER);
                })->toArray();

                $preparedInvitations = [];
                $dbCustomers = Customer::where('user_id', $this->shop->id)
                    ->whereIn('graphql_id', $customerIds)
                    ->get();

                $counter++;

                if ($counter % 10 === 0) {
                    sleep(1);
                }

                foreach ($dbCustomers as $dbCustomer) {
                    $preparedInvitation = InvitationHelper::prepareInvitations($dbCustomer);
                    $preparedInvitation['invitation_group_id'] = $this->invitationGroup->id;
                    $preparedInvitation['status'] = data_get($dbCustomer, 'state') === Customer::STATE_ENABLED
                        ? Invitation::STATUS_SKIPPED : Invitation::STATUS_PENDING;
                    $preparedInvitation['created_at'] = now();
                    $preparedInvitations[] = $preparedInvitation;
                }

                if ($preparedInvitations) {
                    Invitation::insert($preparedInvitations);
                }

                $this->invitationGroup->updateStats();
            }
            catch (\Exception $e) {
                Log::error("Failed to fetch segment customers => " . $e->getMessage());
            }
        } while($hasNextPage);

        $this->invitationGroup->updateStats();
        $this->invitationGroup->customer_fetched = true;
        $this->invitationGroup->save();
    }
}
