<?php

namespace App\Jobs;

use App\Helpers\SettingHelper;
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
use Throwable;

class ProcessInvitationGroupChunkJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels, Queueable;

    protected $shopId;
    protected $invitationGroupId;

    protected $shop;
    protected $invitationGroup;
    protected $invitationIds;

    public function __construct($shop, $invitationGroup, $invitationIds)
    {
        $this->shopId = $shop;
        $this->invitationGroupId = $invitationGroup;
        $this->invitationIds = $invitationIds;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $this->shop = User::find($this->shopId);
        $this->invitationGroup = InvitationGroup::find($this->invitationGroupId);

        if (empty($this->shop) || empty($this->invitationGroup)) {
            Log::error('Shop or Invitation group not found => ' . json_encode($this->shop ?: []) . ' => ' . json_encode($this->invitationGroup ?: []));
            return;
        }

        $shopifyService = new ShopifyService($this->shop);

        $notificationSettings = SettingHelper::getNotificationSettings($this->shop);

        $invitations = Invitation::where('user_id', $this->shop->id)
            ->whereIn('id', $this->invitationIds)
            ->whereNotIn('status', [Invitation::STATUS_SENT, Invitation::STATUS_SKIPPED])
            ->get();

        if ($this->invitationGroup->status === InvitationGroup::STATUS_CANCELED) {
            return;
        }

        try {
            foreach ($invitations as $index => $invitation) {

                $invitationId = data_get($invitation, 'id');
                $customerState = data_get($invitation, 'customer_state');

                if ($customerState === Customer::STATE_ENABLED) {
                    $invitation->status = Invitation::STATUS_SKIPPED;
                    $invitation->error = null;
                    $invitation->save();

                    continue;
                }

                try {
                    $response = $shopifyService->sendCustomerAccountInvite([
                        'customerId' => getGraphqlId(data_get($invitation, 'customer_id'), ShopifyHelper::$CUSTOMER),
                        'email' => $notificationSettings
                    ]);

                    if (data_get($response, 'errors')) {
                        sleep(3);
                        $response = $shopifyService->sendCustomerAccountInvite([
                            'customerId' => getGraphqlId(data_get($invitation, 'customer_id'), ShopifyHelper::$CUSTOMER),
                            'email' => $notificationSettings
                        ]);
                    }
                    $hasErrors = data_get($response, 'errors') || data_get($response, 'body.data.customerSendAccountInviteEmail.userErrors');
                    $shopifyCustomer = data_get($response, 'body.data.customerSendAccountInviteEmail.customer', []);

                    $customerState = $hasErrors ? data_get($invitation, 'customer_state') : data_get($shopifyCustomer, 'state');
                    $status = $hasErrors ? Invitation::STATUS_FAILED : Invitation::STATUS_SENT;
                    $error = $hasErrors ? json_encode(data_get($response, 'body.data.customerSendAccountInviteEmail.userErrors', []) ?: $response) : '';

                }
                catch (\Exception $e) {
                    $status = Invitation::STATUS_FAILED;
                    $error = $e->getMessage();
                }

                $invitation->customer_state = $customerState;
                $invitation->status = $status;
                $invitation->error = $error;
                $invitation->save();

                if ($status === Invitation::STATUS_SENT) {
                    Customer::where('graphql_id', getGraphqlId(data_get($invitation, 'customer_id'), ShopifyHelper::$CUSTOMER))->update(['state' => $customerState]);
                }
            }
        }
        catch (\Exception $e) {
            Log::error("Invitation process failed. Error => " . $e->getMessage() . " => IDs => " . json_encode($this->invitationIds));
        }

        $this->invitationGroup->updateStats();
        $this->invitationGroup = $this->invitationGroup->refresh();

        if ($this->invitationGroup->status === InvitationGroup::STATUS_COMPLETED) {
            AttemptUsageCharge::dispatch($this->shop, $this->invitationGroup);
        }
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('ProcessInvitationGroupChunkJob Failed');
        if ($exception) {
            report($exception);
        }
    }
}
