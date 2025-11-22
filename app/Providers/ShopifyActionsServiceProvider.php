<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class ShopifyActionsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Replace package ActivatePlan with your subclass
        $this->app->bind(
            \Osiset\ShopifyApp\Actions\ActivatePlan::class,
            \App\Actions\Billing\ActivatePlan::class
        );
    }
}
