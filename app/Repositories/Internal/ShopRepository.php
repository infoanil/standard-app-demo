<?php

namespace App\Repositories\Internal;

use App\Interfaces\Internal\ShopRepositoryInterface;
use App\Models\Setting;
use App\Models\User;
use App\Services\ShopifyService;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ShopRepository implements ShopRepositoryInterface
{
    public function getAuthShop(): ?Authenticatable
    {
        return auth()->user();
    }

    public function getShopByDomain($domain)
    {
        return Cache::remember("shop_$domain", 3600, function () use ($domain) {
            return User::where('name', $domain)->first();
        });
    }

    public function updateShop(User $shop, $input = [])
    {
        foreach ($input as $key => $value) {
            $shop->{$key} = $value;
        }
        $shop->save();

        return $shop;
    }

    public function getAndUpdateShop($shop, $from = null)
    {
        try {
            $shopifyService = new ShopifyService($shop);
            $response = $shopifyService->getShopDetails();
            $response = json_decode(json_encode($response), true);

            if (data_get($response, 'errors')) {
                Log::error(data_get($response, 'body'));

                return;
            }

            $shopData = data_get($response, 'body.data.shop');

            if ($shopData) {
                $data = [
                    'development_store' => data_get($shopData, 'plan.partnerDevelopment') ?: false,
                    'shopify_plus'      => data_get($shopData, 'plan.shopifyPlus') ?: false,
                    'timezone'          => data_get($shopData, 'ianaTimezone') ?: 'UTC',
                    'email'             => data_get($shopData, 'email') ?: $shop->email,
                    'store_plan_name'   => data_get($shopData, 'plan.publicDisplayName') ?: null,
                ];

                if ($shop->trial_ends_at === null && !$shop->plan_id) {
                    $data['trial_ends_at'] = now()->addDays(7)->toDateString();
                }
                $this->updateShop($shop, $data);

                $senderEmail = data_get($shopData, 'contactEmail') ?: data_get($shopData, 'email');
                if ($senderEmail) {
                    (new SettingRepository())->setSettings($shop, [
                        Setting::GROUP_EMAIL => [
                            'sender_email' => [
                                'key'   => 'sender_email',
                                'value' => $senderEmail,
                            ],
                        ],
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error($e->getMessage());
        }
    }
}
