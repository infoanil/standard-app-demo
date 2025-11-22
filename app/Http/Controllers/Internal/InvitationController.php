<?php

namespace App\Http\Controllers\Internal;

use App\Helpers\SettingHelper;
use App\Helpers\ShopifyHelper;
use App\Http\Controllers\Controller;
use App\Interfaces\Internal\InvitationsRepositoryInterface;
use App\Models\Invitation;
use App\Repositories\Internal\InvitationGroupRepository;
use App\Services\ShopifyService;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    private InvitationsRepositoryInterface $invitationsRepository;

    public function __construct(InvitationsRepositoryInterface $invitationsRepository) {
        $this->invitationsRepository = $invitationsRepository;
    }

    /**
     * Fetch list of invitations
     */
    public function index(Request $request, $invitationGroupId)
    {
        $params = $request->all();
        if (!data_get($params, 'per_page')) {
            $params['per_page'] = 20;
        }

        return preparedResponse(['invitations' => $this->invitationsRepository->getInvitations($request->user(), $invitationGroupId, $params)]);
    }

    /**
     * Send invitation
     */
    public function invite(Request $request, $invitationGroupId, $invitationId)
    {
        $request->validate([
            'invitation' => 'required'
        ]);

        $shop = $request->user();

        $invitation = $this->invitationsRepository->getInvitation($shop, $invitationId);

        if (!$invitation) {
            return preparedResponse('Invitation not found', 404, true);
        }

        $shopifyService = new ShopifyService($shop);

        $response = $shopifyService->sendCustomerAccountInvite([
            'customerId' => getGraphqlId($invitation->customer_id, ShopifyHelper::$CUSTOMER),
            'email' => SettingHelper::getNotificationSettings($shop)
        ]);

        if (data_get($response, 'errors') || data_get($response, 'body.data.customerSendAccountInviteEmail.userErrors')) {
            return preparedResponse(
                data_get($response, 'body.data.customerSendAccountInviteEmail.userErrors.message', data_get($response, 'body')),
                400,
                true
            );
        }

        $customer = data_get($response, 'body.data.customerSendAccountInviteEmail.customer', []);
        if (!$customer) {
            return preparedResponse('Something went wrong while sending the invitation', 400, true);
        }

        $invitation = $this->invitationsRepository->updateInvitation($shop, $invitation, [
            'customer_state' => data_get($customer, 'state'),
            'status' => Invitation::STATUS_SENT,
        ]);

        $invitationGroup = (new InvitationGroupRepository())->getInvitationGroup($shop, $invitationGroupId);
        if (!$invitationGroup) {
            return preparedResponse('Invitation group not found', 404, true);
        }
        $invitationGroup->updateStats();

        return preparedResponse([
            'invitation' => $invitation,
        ]);
    }
}
