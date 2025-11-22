<?php

namespace App\Http\Controllers\Internal;

use App\Helpers\InvitationHelper;
use App\Helpers\SettingHelper;
use App\Helpers\ShopifyHelper;
use App\Http\Controllers\Controller;
use App\Interfaces\Internal\CustomerRepositoryInterface;
use App\Models\BulkOperation;
use App\Models\Customer;
use App\Models\Invitation;
use App\Models\InvitationGroup;
use App\Repositories\Internal\InvitationsRepository;
use App\Services\ShopifyService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class CustomerController extends Controller
{
    private CustomerRepositoryInterface $customerRepository;

    public function __construct(CustomerRepositoryInterface $customerRepository) {
        $this->customerRepository = $customerRepository;
    }

    /**
     * Fetch list of customers.
     */
    public function index(Request $request)
    {
        $params = $request->all();
        if (!data_get($params, 'per_page')) {
            $params['per_page'] = 20;
        }

        return preparedResponse(['customers' => $this->customerRepository->getCustomers($request->user(), $params)]);
    }

    /**
     * Send bulk invites to customers.
     */
    public function bulkInvite(Request $request): JsonResponse
    {
        $request->validate([
            'customers' => 'required|array|max:20'
        ]);

        $shop = $request->user();

        $invitationGroupsCount = InvitationGroup::withTrashed()->where('user_id', $shop->id)->count() + 1000;
        $invitationGroup = InvitationGroup::create([
            'user_id' => $shop->id,
            'name' => 'Invitation Group #' . ($invitationGroupsCount + 1),
        ]);

        $preparedInvitations = [];
        $dbCustomers = Customer::where('user_id', $shop->id)
            ->whereIn('id', $request->input('customers'))
            ->get();

        foreach ($dbCustomers as $dbCustomer) {
            $preparedInvitation = InvitationHelper::prepareInvitations($dbCustomer);
            $preparedInvitation['invitation_group_id'] = $invitationGroup->id;
            $preparedInvitation['status'] = Invitation::STATUS_PENDING;
            $preparedInvitation['created_at'] = now();
            $preparedInvitations[] = $preparedInvitation;
        }

        if ($preparedInvitations) {
            Invitation::insert($preparedInvitations);
        }

        $invitationGroup->updateStats();

        return preparedResponse([
            'invitation_group' => $invitationGroup
        ]);
    }

    /**
     * Send an invitation to a single customer.
     */
    public function invite(Request $request, $customerId): JsonResponse
    {
        $shop = $request->user();
        $shopifyService = new ShopifyService($shop);

        $customer = $this->customerRepository->getCustomer($shop, $customerId);
        if (!$customer) {
            return preparedResponse('Customer not found', 404, true);
        }

        $response = $shopifyService->sendCustomerAccountInvite([
            'customerId' => $customer->graphql_id,
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

        $customer = $this->customerRepository->updateCustomer($shop, $customer, [
            'state' => data_get($responseCustomer, 'state'),
        ]);

        (new InvitationsRepository())->storeInvitation($shop, [
            'user_id' => $shop->id,
            'customer_id' => data_get($customer, 'graphql_id'),
            'email' => data_get($customer, 'email'),
            'customer_name' => data_get($customer, 'name'),
            'customer_state' => data_get($customer, 'state'),
            'status' => Invitation::STATUS_SENT,
        ]);

        return preparedResponse([
            'customer' => $customer,
        ]);
    }

    /**
     * Send an invitation to a single customer.
     */
    public function createInvitationUrl(Request $request, $customerId): JsonResponse
    {
        $shop = $request->user();
        $shopifyService = new ShopifyService($shop);

        $customer = $this->customerRepository->getCustomer($shop, $customerId);
        if (!$customer) {
            return preparedResponse('Customer not found', 404, true);
        }

        $response = $shopifyService->createCustomerAccountInvite($customer->graphql_id);

        if (data_get($response, 'errors') || data_get($response, 'body.data.customerGenerateAccountActivationUrl.userErrors')) {
            return preparedResponse(
                data_get($response, 'body.data.customerGenerateAccountActivationUrl.userErrors.message', data_get($response, 'body')),
                400,
                true
            );
        }

        return preparedResponse([
            'invitation_url' => data_get($response, 'body.data.customerGenerateAccountActivationUrl.accountActivationUrl'),
        ]);
    }

    /**
     * Send customer login url to admin.
     */
    public function createLoginUrl(Request $request, $customerId)
    {
        $shop = $request->user();
        $shopifyService = new ShopifyService($shop);

        $customer = $this->customerRepository->getCustomer($shop, $customerId);
        if (!$customer) {
            return preparedResponse('Customer not found', 404, true);
        }

        $response = $shopifyService->generateMultiPassToken([
            'email' => $customer->email
        ]);

        $multiPassToken = data_get($response, 'token');

        if (data_get($response, 'errors') || !$multiPassToken) {
            return preparedResponse(
                data_get($response, 'message', 'Unable to generate login url'),
                400,
                true
            );
        }

        return preparedResponse([
            'url' => "https://$shop->name/account/login/multipass/$multiPassToken",
        ]);
    }

    /**
     * Fetch customers from a given Shopify segment.
     *
     * @throws Exception
     */
    public function segmentCustomers(Request $request): JsonResponse
    {
        $request->validate([
            'segment' => 'required'
        ]);

        $segmentId = $request->query('segment');

        $shop = $request->user();
        $shopifyService = new ShopifyService($shop);

        $segmentId = getGraphqlId($segmentId, ShopifyHelper::$SEGMENT);
        $response = $shopifyService->getSegmentCustomersCount($segmentId);

        $customers = data_get($response, 'body.data.customerSegmentMembers.totalCount', 0);
        $errors = data_get($response, 'errors') || !empty(data_get($response, 'body.data.customerSegmentMembers.userErrors'));

        return response()->json([
            'errors' => $errors,
            'customers' => $customers,
            'message' => $errors ? data_get($response, 'errors') : 'Success'
        ]);
    }

    /**
     * Sync all customers from shopify store.
     *
     * @throws Exception
     */
    public function syncCustomers(Request $request): JsonResponse
    {
        $shop = $request->user();

        $bulkOperation = BulkOperation::where('user_id', $shop->id)
            ->where('type', BulkOperation::TYPE_CUSTOMERS)
            ->where('sync_status', BulkOperation::STATUS_CREATED)
            ->where('created_at', '>', now()->subHours(2))
            ->first();

        if ($bulkOperation) {
            return preparedResponse('Sync is already in progress. Please wait for the current sync to complete.', 422, true);
        }

        Artisan::call("app:sync-customers $shop->name");

        return preparedResponse([
            'message' => 'Customer sync has begun. Please wait until it finishes.',
        ]);
    }

    public function customerBulkOperationStatus(Request $request): JsonResponse
    {
        $shop = $request->user();

        $bulkOperation = BulkOperation::where('user_id', $shop->id)
            ->where('type', BulkOperation::TYPE_CUSTOMERS)
            ->where('sync_status', BulkOperation::STATUS_CREATED)
            ->exists();

        return preparedResponse([
            'bulkOperationInProgress' => $bulkOperation,
        ]);
    }
}
