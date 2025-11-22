<?php

namespace App\Services;

use App\Helpers\ShopifyHelper;
use App\Models\Setting;
use App\Models\User;
use App\Repositories\Internal\SettingRepository;

class ShopifyService
{
    protected User $shop;

    /**
     * Initialize ShopifyService with user credentials.
     */
    public function __construct(?User $shop)
    {
        $this->shop = $shop;
    }

    /**
     * Get Shopify Store Details.
     */
    public function getShopDetails(): array
    {
        $query = <<<'GQL'
        {
            shop {
                id
                name
                email
                contactEmail
                ianaTimezone
                primaryDomain {
                   url
                }
                plan {
                   partnerDevelopment
                   shopifyPlus
                   publicDisplayName
                }
            }
        }
        GQL;

        return $this->execute($query);
    }

    public function getUsageChargeDetails()
    {

        $appId = config('shopify-app.api_key');

        $query = <<<QUERY
        {
            appByKey(apiKey: "$appId") {
                installation {
                    activeSubscriptions {
                        lineItems {
                            plan {
                                pricingDetails {
                                    ... on AppUsagePricing {
                                        balanceUsed {
                                            amount
                                        }
                                        cappedAmount {
                                            amount
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        QUERY;

        return $this->execute($query);
    }


    /**
     * Get Customer Details.
     */
    public function getCustomer($input)
    {
        $query = <<<'GQL'
        query($identifier: CustomerIdentifierInput!) {
          customer: customerByIdentifier(identifier: $identifier) {
            id
            firstName
            lastName
            email
            state
            tags
          }
        }
        GQL;

        return $this->execute($query, $input);
    }

    /**
     * Get first 10 customers from Shopify.
     */
    public function getCustomers(int $pageSize, ?string $cursor = null, string $direction = 'forward'): array
    {
        $isBackward = ($direction === 'backward');

        $queryString = ShopifyHelper::prepareGraphQlQueryString(array_filter([
            ($isBackward ? 'last' : 'first')   => $pageSize,
            ($isBackward ? 'before' : 'after') => $cursor,
        ]));

        $query = <<<QUERY
        query getCustomers {
            customers($queryString) {
                edges {
                    node {
                        id
                        firstName
                        lastName
                        email
                        state
                        tags
                        createdAt
                    }
                    cursor
                }
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                }
            }
        }
        QUERY;

        return $this->execute($query);
    }

    /**
     * Send customers invite mail.
     */
    public function sendCustomerAccountInvite($input): array
    {
        $query = '
            mutation CustomerSendAccountInviteEmail($customerId: ID!, $email: EmailInput!) {
                customerSendAccountInviteEmail(customerId: $customerId, email: $email) {
                    customer {
                        id
                        state
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        ';

        return $this->execute($query, $input);
    }

    /**
     * Create customers invitation link.
     */
    public function createCustomerAccountInvite($id): array
    {
        $query = <<<QUERY
            mutation customerGenerateAccountActivationUrl {
              customerGenerateAccountActivationUrl(customerId: "$id") {
                accountActivationUrl
                userErrors {
                    field
                    message
                }
              }
            }
        QUERY;

        return $this->execute($query);
    }

    /**
     * Get Customer segments
     */
    public function getSegments(): array
    {
        $segments = [];
        $hasNextPage = false;
        $next = null;
        $queries = [
            'first' => 250,
        ];

        do {
            if ($next) {
                $queries['after'] = $next;
            }
            $queryString = ShopifyHelper::prepareGraphQlQueryString($queries);
            $query = <<<QUERY
                query getSegments {
                    segments($queryString) {
                      edges {
                        node {
                            id
                            name
                        }
                     }
                     pageInfo {
                        hasNextPage
                        hasPreviousPage
                        startCursor
                        endCursor
                     }
                  }
                }
            QUERY;

            $response = $this->execute($query);
            $response = json_decode(json_encode($response), true);

            $segments = array_merge($segments, data_get($response, 'body.data.segments.edges', []));
            $hasNextPage = data_get($response, 'body.data.segments.pageInfo.hasNextPage');
            $next = data_get($response, 'body.data.segments.pageInfo.endCursor');

        } while ($hasNextPage);

        return collect($segments)->pluck('node')->toArray();
    }

    public function createSegment($input)
    {
        $query = <<<QUERY
                mutation segmentCreate(\$name: String!, \$query: String!) {
                  segmentCreate(name: \$name, query: \$query) {
                    segment {
                      id
                      name
                      query
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }
            QUERY;

        return $this->execute($query, $input);
    }

    public function createCustomers($email, $name)
    {
        $mutation = <<<QUERY
            mutation createCustomer(\$input: CustomerInput!) {
                customerCreate(input: \$input) {
                    customer {
                        id
                        email
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
            QUERY;

        $variables = [
            'input' => [
                'email' => $email,
                'firstName' => $name,
            ]
        ];


        return $this->execute($mutation, $variables);
    }

    public function getSegmentCustomers($queries): array
    {

        $queryString = ShopifyHelper::prepareGraphQlQueryString($queries);

        $query = <<<QUERY
            query getSegmentMembers {
                customerSegmentMembers($queryString) {
                    edges {
                        node {
                            id
                        }
                    }
                    pageInfo {
                        endCursor
                        hasNextPage
                        hasPreviousPage
                        startCursor
                    }
                    totalCount
                }
            }
        QUERY;

        return $this->execute($query);
    }

    public function getSegmentCustomersCount($id): array
    {
        $query = <<<QUERY
            query getSegmentMembers {
                customerSegmentMembers(first: 1000, segmentId: "$id") {
                    totalCount
                }
            }
        QUERY;

        return $this->execute($query);
    }

    public function runBulkOperation($fields)
    {
        $query = <<<QUERY
        mutation {
          bulkOperationRunQuery(
           query: """
            {
                $fields
            }
            """
          ) {
            bulkOperation {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
        QUERY;

        return $this->execute($query);
    }

    public function getBulkOperation($id)
    {
        $query = <<<QUERY
        query {
          node(id: "$id") {
            ... on BulkOperation {
              status
              url
              partialDataUrl
              objectCount
              rootObjectCount
              errorCode
            }
          }
        }
        QUERY;

        return $this->execute($query);
    }

    public function createRecurringCharge(array $input): array
    {
        $query = <<<QUERY
            mutation appSubscriptionCreate(
                \$name: String!,
                \$returnUrl: URL!,
                \$trialDays: Int,
                \$test: Boolean,
                \$lineItems: [AppSubscriptionLineItemInput!]!
            ) {
                appSubscriptionCreate(
                    name: \$name,
                    returnUrl: \$returnUrl,
                    trialDays: \$trialDays,
                    test: \$test,
                    lineItems: \$lineItems
                ) {
                    appSubscription {
                        id
                    }
                    confirmationUrl
                    userErrors {
                        field
                        message
                    }
                }
            }
        QUERY;

        return $this->execute($query, $input);
    }

    public function getActiveRecurringCharge(): array
    {
        $query = <<<QUERY
        query {
          currentAppInstallation {
            activeSubscriptions {
              id
              name
              status
              createdAt
              trialDays
              returnUrl
              test
              lineItems {
                plan {
                  pricingDetails {
                    __typename
                    ... on AppRecurringPricing {
                      interval
                      price {
                        amount
                        currencyCode
                      }
                    }
                    ... on AppUsagePricing {
                      cappedAmount {
                        amount
                        currencyCode
                      }
                      terms
                    }
                  }
                }
              }
            }
          }
        }
        QUERY;

        return $this->execute($query);
    }

    public function cancelRecurringCharge(string $chargeId): array
    {
        $mutation = <<<QUERY
        mutation cancelCharge(\$chargeId: ID!) {
            appSubscriptionCancel(id: \$chargeId) {
                userErrors {
                    field
                    message
                }
                appSubscription {
                    id
                    status
                }
            }
        }
        QUERY;

        return $this->execute($mutation, ['chargeId' => $chargeId]);
    }

    public function generateMultiPassToken($input)
    {
        $multiPassSecret = (new SettingRepository())->getSetting($this->shop, Setting::GROUP_GENERAL,
            'multi_pass_token');
        $multiPassSecret = data_get($multiPassSecret, 'value');

        if (!$multiPassSecret) {
            return [
                'message' => 'Multi pass token is required! Please add it in app settings',
                'errors'  => true,
            ];
        }

        try {
            $multiPassHash = hash("sha256", $multiPassSecret, true);
            $encryptionKey = substr($multiPassHash, 0, 16);
            $signatureKey = substr($multiPassHash, 16, 16);

            $input["created_at"] = date("c");

            $iv = openssl_random_pseudo_bytes(16);

            $ciphertext = $iv.openssl_encrypt(
                    json_encode($input),
                    "AES-128-CBC",
                    $encryptionKey,
                    OPENSSL_RAW_DATA,
                    $iv
                );

            return [
                'token' => strtr(
                    base64_encode($ciphertext.hash_hmac("sha256", $ciphertext, $signatureKey, true)),
                    '+/',
                    '-_'
                ),
            ];
        } catch (\Exception $e) {
            report($e);

            return [
                'message' => 'Unable to generate login url',
                'errors'  => true,
            ];
        }
    }

    /**
     * Send a GraphQL request to Shopify with error handling and logging.
     */
    public function execute($query, $input = [])
    {
        $response = [];
        $retry = 3;
        do {
            try {
                $response = empty($input) ?
                    $this->shop->api()->graph($query) :
                    $this->shop->api()->graph($query, $input);

                $response = json_decode(json_encode($response), true);
                $retry = 0;

            } catch (\Exception $e) {
                $retry--;

                if ($retry <= 0) {
                    $response = [
                        'errors' => true,
                        'body'   => $e->getMessage(),
                    ];
                }
                sleep(2);
            }
        } while ($retry > 0);

        return $response;
    }
}
