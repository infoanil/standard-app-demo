<?php

namespace App\Http\Controllers\Internal;

use App\Models\Plan;
use App\Models\User;
use App\Services\ShopifyService;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Osiset\ShopifyApp\Objects\Values\ShopDomain;
use Osiset\ShopifyApp\Services\ChargeHelper;
use Osiset\ShopifyApp\Util;

class ChargeController extends Controller
{

    protected $chargeHelper;

    public function __construct(ChargeHelper $chargeHelper)
    {
        $this->chargeHelper = $chargeHelper;
    }

    public function index(Request $request, $planId)
    {
        $shop = User::where('name', $request->query('shop'))->first();
        $host = urldecode($request->get('host'));

        if (!$shop) {
            return response()->json(['error' => 'Shop not found'], 404);
        }

        $plan = Plan::find($planId);
        if (!$plan) {
            return response()->json(['error' => 'Plan not found'], 404);
        }

        $url = $this->getPlanUrl(
            $shop,
            $plan,
            $host
        );


        // Do a fullpage redirect
        return View::make(
            'shopify-app::billing.fullpage_redirect',
            [
                'url' => $url,
                'host' => $host,
                'locale' => $request->get('locale'),
                'apiKey' => Util::getShopifyConfig('api_key', ShopDomain::fromNative($request->get('shop'))),
            ]
        );
    }

    public function getPlanUrl($shop, $plan, $host) {
        $planDetails = $this->chargeHelper->details($plan, $shop, $host);

        if ($planDetails) {
            $planDetails = $planDetails->toArray();
        }

        if ($plan->discount) {
            $planDetails['discount'] = $plan->discount['amount'];
        }

        $api = $this->createChargeQuery($shop, $planDetails);

        return $api['confirmationUrl'];
    }


    public function createChargeQuery($shop, $payload)
    {
        $query = '
        mutation appSubscriptionCreate(
            $name: String!,
            $returnUrl: URL!,
            $trialDays: Int,
            $test: Boolean,
            $lineItems: [AppSubscriptionLineItemInput!]!
        ) {
            appSubscriptionCreate(
                name: $name,
                returnUrl: $returnUrl,
                trialDays: $trialDays,
                test: $test,
                lineItems: $lineItems
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
        ';
        $variables = [
            'name' => $payload['name'],
            'returnUrl' => $payload['return_url'],
            'trialDays' => $payload['trial_days'],
            'test' => $payload['test'],
            'lineItems' => [
                [
                    'plan' => [
                        'appRecurringPricingDetails' => [
                            'price' => [
                                'amount' => $payload['price'],
                                'currencyCode' => 'USD',
                            ],
                            'interval' => $payload['interval'],
                        ]
                    ],
                ]
            ],
        ];

        if (!empty($payload['discount']) && $payload['discount']) {
            $variables['lineItems'][0]['plan']['appRecurringPricingDetails']['discount'] = [
                'value' => [
                    'amount' => $payload['discount'],
                ],
            ];
        }

        if (!empty($payload['capped_amount']) && $payload['capped_amount']) {
            $variables['lineItems'][] = [
                'plan' => [
                    'appUsagePricingDetails' => [
                        'cappedAmount' => [
                            'amount' => $payload['capped_amount'],
                            'currencyCode' => 'USD',
                        ],
                        'terms' => $payload['terms'],
                    ]
                ],
            ];
        }

        $shopifyService = new ShopifyService($shop);

        $response = $shopifyService->execute($query, $variables);

        return $response['body']['data']['appSubscriptionCreate'];
    }
}
