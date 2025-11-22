<?php

namespace App\Http\Controllers\Api;

use App\Helpers\SettingHelper;
use App\Http\Controllers\Controller;
use App\Interfaces\Internal\CustomerRepositoryInterface;
use App\Models\Customer;
use App\Models\Invitation;
use App\Repositories\Internal\InvitationsRepository;
use App\Services\ShopifyService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    private CustomerRepositoryInterface $customerRepository;

    public function __construct(CustomerRepositoryInterface $customerRepository) {
        $this->customerRepository = $customerRepository;
    }

    public function invite(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $shop = $request->get('shop');
        $email = $request->input('email');

        if (!$shop->plan_id && !$shop->is_trial_active && !$shop->development_store) {
            return preparedResponse('Plan is not selected!', 403, true);
        }

        if (!$shop->development_store) {
            if ($shop->plan) {
                $features = $shop->plan->features()->pluck('slug')->toArray();
                if (!in_array('login-helper', $features)) {
                    return preparedResponse('This feature is not available for selected plan', 403, true);
                }
            }
            else {
                return preparedResponse('Plan is not selected!', 403, true);
            }
        }

        $shopifyService = new ShopifyService($shop);

        $shopifyCustomer = $shopifyService->getCustomer([
            'identifier' => [
                'emailAddress' => $email
            ]
        ]);

        $shopifyCustomer = data_get($shopifyCustomer, 'body.data.customer') ?: null;

        if (!$shopifyCustomer) {
            return preparedResponse('Customer not found', 404, true);
        }

        if (data_get($shopifyCustomer, 'state') === Customer::STATE_ENABLED) {
            return preparedResponse([
                'state' => data_get($shopifyCustomer, 'state'),
                'invited' => false,
                'message' => 'Customer is enabled'
            ]);
        }

        $response = $shopifyService->sendCustomerAccountInvite([
            'customerId' => data_get($shopifyCustomer, 'id'),
            'email' => SettingHelper::getNotificationSettings($shop)
        ]);

        if (data_get($response, 'errors') || data_get($response, 'body.data.customerSendAccountInviteEmail.userErrors')) {
            return preparedResponse(
                data_get($response, 'body.data.customerSendAccountInviteEmail.userErrors.message', data_get($response, 'body')),
                400,
                true
            );
        }

        $responseCustomer = data_get($response, 'body.data.customerSendAccountInviteEmail.customer', []);
        if (!$responseCustomer) {
            return preparedResponse('Something went wrong while sending the invitation', 400, true);
        }

        (new InvitationsRepository())->storeInvitation($shop, [
            'user_id' => $shop->id,
            'customer_id' => data_get($shopifyCustomer, 'id'),
            'email' => data_get($shopifyCustomer, 'email'),
            'customer_name' => trim(data_get($shopifyCustomer, 'firstName') . ' ' . data_get($shopifyCustomer, 'lastName')),
            'customer_state' => data_get($responseCustomer, 'state'),
            'status' => Invitation::STATUS_SENT,
            'source' => Invitation::SOURCE_FRONTEND,
        ]);

        $customer = $this->customerRepository->getCustomer($shop, $email, [], Customer::EMAIL);
        if ($customer) {
            $this->customerRepository->updateCustomer($shop, $customer, [
                'state' => data_get($responseCustomer, 'state'),
            ]);
        }

        return preparedResponse([
            'state' => data_get($responseCustomer, 'state'),
            'invited' => true,
            'message' => 'Invitation sent successfully'
        ]);
    }

    public function sendInvitation(Request $request)
    {
        $data = $request->all();
        $data = data_get($data, 'properties');

        $shop = $request->get('shop');

        $customerId = data_get($data, 'customer_id');
        $email = data_get($data, 'email');

        if (!$shop->plan_id && !$shop->is_trial_active && !$shop->development_store) {
            return preparedResponse('Plan is not selected!', 403, true);
        }

        if (!$shop->development_store) {
            if ($shop->plan) {
                $features = $shop->plan->features()->pluck('slug')->toArray();
                if (!in_array('shopify-flow', $features)) {
                    return preparedResponse('This feature is not available for selected plan', 403, true);
                }
            }
            else {
                return preparedResponse('Plan is not selected!', 403, true);
            }
        }

        $shopifyService = new ShopifyService($shop);

        $identifier = [
            'id' => $customerId
        ];

        if (!empty($email)) {
            $identifier =  [
                'emailAddress' => $email
            ];
        }

        $shopifyCustomer = $shopifyService->getCustomer([
            'identifier' => $identifier
        ]);

        $shopifyCustomer = data_get($shopifyCustomer, 'body.data.customer') ?: null;

        if (!$shopifyCustomer) {
            return preparedResponse('Customer not found => ' . json_encode($identifier), 404, true);
        }

        if (data_get($shopifyCustomer, 'state') === Customer::STATE_ENABLED) {
            return preparedResponse([
                'state' => data_get($shopifyCustomer, 'state'),
                'invited' => false,
                'message' => 'Customer is enabled already'
            ]);
        }

        $response = $shopifyService->sendCustomerAccountInvite([
            'customerId' => data_get($shopifyCustomer, 'id'),
            'email' => SettingHelper::getNotificationSettings($shop)
        ]);

        if (data_get($response, 'errors') || data_get($response, 'body.data.customerSendAccountInviteEmail.userErrors')) {
            return preparedResponse(
                data_get($response, 'body.data.customerSendAccountInviteEmail.userErrors.message', data_get($response, 'body')),
                400,
                true
            );
        }

        $responseCustomer = data_get($response, 'body.data.customerSendAccountInviteEmail.customer', []);
        if (!$responseCustomer) {
            return preparedResponse('Something went wrong while sending the invitation', 400, true);
        }

        (new InvitationsRepository())->storeInvitation($shop, [
            'user_id' => $shop->id,
            'customer_id' => data_get($shopifyCustomer, 'id'),
            'email' => data_get($shopifyCustomer, 'email'),
            'customer_name' => trim(data_get($shopifyCustomer, 'firstName') . ' ' . data_get($shopifyCustomer, 'lastName')),
            'customer_state' => data_get($responseCustomer, 'state'),
            'status' => Invitation::STATUS_SENT,
            'source' => Invitation::SOURCE_FLOW,
        ]);

        $customer = $this->customerRepository->getCustomer($shop, data_get($shopifyCustomer, 'id'), [], Customer::GRAPHQL_ID);
        if ($customer) {
            $this->customerRepository->updateCustomer($shop, $customer, [
                'state' => data_get($responseCustomer, 'state'),
            ]);
        }

        return preparedResponse([
            'state' => data_get($responseCustomer, 'state'),
            'invited' => true,
            'message' => 'Invitation sent successfully'
        ]);
    }

    public function createLoginUrl(Request $request)
    {
        $request->validate([
            'id' => 'required'
        ]);

        $shop = $request->get('shop');

        if (!$shop->plan_id && !$shop->is_trial_active && !$shop->development_store) {
            return preparedResponse('Your free trial is over. Upgrade now to unlock full access.', 403, true);
        }

        if (!$shop->development_store && !$shop->shopify_plus) {
            return preparedResponse('This feature is exclusively available for Shopify Plus only.', 403, true);
        }

        if (!$shop->development_store) {
            if ($shop->plan) {
                $features = $shop->plan->features()->pluck('slug')->toArray();
                if (!in_array('multipass-login', $features)) {
                    return preparedResponse('This feature is not available for selected plan', 403, true);
                }
            }
            else {
                return preparedResponse('Plan is not selected!', 403, true);
            }
        }

        $customerGraphqlId = $request->input('id');

        $shopifyService = new ShopifyService($shop);

        $customer = $this->customerRepository->getCustomer($shop, $customerGraphqlId, [], Customer::GRAPHQL_ID);
        if (!$customer) {
            $customer = $shopifyService->getCustomer([
                'identifier' => [
                    'id' => $customerGraphqlId
                ]
            ]);

            $customer = data_get($customer, 'body.data.customer') ?: null;

            if (!$customer) {
                return preparedResponse('Customer not found', 404, true);
            }
        }

        $response = $shopifyService->generateMultiPassToken([
            'email' => data_get($customer, 'email')
        ]);

        $multiPassToken = data_get($response, 'token');

        if (data_get($response, 'errors') || !$multiPassToken) {
            return preparedResponse(
                data_get($response, 'message', 'Unable to generate login url'),
                400,
                true
            );
        }

        data_set($customer, 'login_url', "https://$shop->name/account/login/multipass/$multiPassToken");

        return preparedResponse([
            'customer' => $customer
        ]);
    }
}
