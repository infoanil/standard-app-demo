<?php

use App\Helpers\ShopifyHelper;
use App\Models\Plan;
use App\Services\ShopifyService;
use Illuminate\Support\Facades\DB;

function isJSON($string)
{
    return is_string($string) && is_array(json_decode($string, true)) && (json_last_error() == JSON_ERROR_NONE);
}

function bulkUpdate($table, $values, $index = 'id')
{
    $final = [];
    $ids = [];

    if (!count($values)) return false;

    if (empty($index)) return false;

    $slots = [];
    foreach ($values as $key => $val) {
        $ids[] = $val[$index];
        foreach (array_keys($val) as $field) {
            if ($field !== $index) {
                $value = (is_null($val[$field]) ? NULL : $val[$field]);
                $slotKey = ':' . $field . '_' . $key;

                $slots[$slotKey] = $value;
                $final[$field][] = "WHEN `$index` = " . $val[$index] . " THEN " . $slotKey . " ";
            }
        }
    }

    $cases = '';
    foreach ($final as $k => $v) {
        $cases .= '`' . $k . '` = (CASE ' . implode("\n", $v) . "\n"
            . 'ELSE `' . $k . '` END), ';
    }

    $query = "UPDATE `$table` SET " . substr($cases, 0, -2) . " WHERE `$index` IN(" . implode(',', $ids) . ");";

    return DB::statement($query, $slots);
}

function getResourceId($gid): int
{
    return (int) substr(strrchr($gid, '/'), 1);
}

function getGraphqlId($id, $type)
{
    $id = is_string($id) ? trim($id) : $id;

    if (str($id)->startsWith('gid://')) {
        return $id;
    }

    $prefix = 'gid://shopify';

    return match($type) {
        ShopifyHelper::$CUSTOMER => join('/', [$prefix, ShopifyHelper::$CUSTOMER, $id]),
        ShopifyHelper::$SEGMENT => join('/', [$prefix, ShopifyHelper::$SEGMENT, $id]),
        default => $id
    };
}

function preparedResponse($data, $statusCode = 200, $errors = false)
{
    $preparedData = [];
    if (!str($statusCode)->startsWith('20') || $errors) {
        $preparedData['message'] = $data;
        $preparedData['errors'] = true;
    } else {
        $preparedData = $data;
    }

    if ($errors) {
        $preparedData['errors'] = $errors;
    }

    return response()->json(
        $preparedData,
        $statusCode ?: 400
    );
}

if (!function_exists('calculateTotalCharge')) {
    function calculateTotalCharge(int $customerNumbers, $shop, $startFromZero = true)
    {
        $isFreePlan = $shop && $shop->plan && $shop->plan->slug === Plan::FREE_PLAN;
        if ($isFreePlan || !$shop->plan || $shop->development_store) {
            return 0;
        }
        $FREE_CAP = ($shop && $shop->invite_limit &&  $shop->invite_limit > 5000) ? $shop->invite_limit : 5000;
        $RATE     = 0.001;

        $shopifyService = new ShopifyService($shop);
        $response = $shopifyService->getUsageChargeDetails();
        $subscriptions = data_get($response, 'body.data.appByKey.installation.activeSubscriptions') ?: [];

        if (data_get($response, 'errors')) {
            sleep(1);
            $response = $shopifyService->getUsageChargeDetails();
            $subscriptions = data_get($response, 'body.data.appByKey.installation.activeSubscriptions') ?: [];
        }
        $usedBalance = 0;

        foreach ($subscriptions as $subscription) {
            $lineItems = data_get($subscription, 'lineItems') ?: [];

            foreach ($lineItems as $lineItem) {
                $balanceUsed = data_get($lineItem, 'plan.pricingDetails.balanceUsed.amount');

                if (!empty($balanceUsed)) {
                    $usedBalance = $balanceUsed;
                }
            }
        }

        $MAX_CHARGE = 50.0 - ($usedBalance ?: 0);

        $remaining = $customerNumbers;
        $totalInvited = $shop->invitations()->where('status', 'SENT')->whereNotNull('invitation_group_id')->count('customer_id');

        if ($startFromZero) {
            $start = $totalInvited;
            $end = $totalInvited + $remaining;
        } else {
            $start = $totalInvited - $remaining;
            $end = $totalInvited;
        }

        $chargeableStart = max($start, $FREE_CAP);
        $unitsToBill     = max(0, $end - $chargeableStart);
        $charge = $unitsToBill * $RATE;

        if ($startFromZero) {
            return round(min($charge, $MAX_CHARGE >= 0 ? $MAX_CHARGE : 0), 4);
        }

        return [
            'amount' => round(min($charge, $MAX_CHARGE >= 0 ? $MAX_CHARGE : 0), 4),
            'free_invites' => max($remaining - $unitsToBill, 0),
            'charged' => $unitsToBill,
        ];
    }
}

if (!function_exists('useMoreMemory')) {
    function useMoreMemory()
    {
        ini_set('memory_limit', '1024M');
    }
}
