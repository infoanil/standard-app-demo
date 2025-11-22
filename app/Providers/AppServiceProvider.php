<?php

namespace App\Providers;

use App\Actions\Billing\ActivatePlan;
use Illuminate\Support\ServiceProvider;
use Osiset\ShopifyApp\Actions\ActivatePlan as OsisetActivatePlan;
use Osiset\ShopifyApp\Actions\CancelCurrentPlan;
use Osiset\ShopifyApp\Contracts\Commands\Charge as OsisetChargeCommand;
use Osiset\ShopifyApp\Contracts\Commands\Shop as OsisetShopCommand;
use Osiset\ShopifyApp\Contracts\Queries\Plan as OsisetPlanQuery;
use Osiset\ShopifyApp\Contracts\Queries\Shop as OsisetShopQuery;
use Osiset\ShopifyApp\Services\ChargeHelper as OsisetChargeHelper;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(OsisetActivatePlan::class, function ($app) {
            return new ActivatePlan(
                $app->make(CancelCurrentPlan::class),
                $app->make(OsisetChargeHelper::class),
                $app->make(OsisetShopQuery::class),
                $app->make(OsisetPlanQuery::class),
                $app->make(OsisetChargeCommand::class),
                $app->make(OsisetShopCommand::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
