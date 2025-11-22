<?php

namespace App\Providers;

use App\Interfaces\Internal\ApiTokenRepositoryInterface;
use App\Interfaces\Internal\CustomerRepositoryInterface;
use App\Interfaces\Internal\FeatureRepositoryInterface;
use App\Interfaces\Internal\InvitationGroupRepositoryInterface;
use App\Interfaces\Internal\InvitationsRepositoryInterface;
use App\Interfaces\Internal\PlanRepositoryInterface;
use App\Interfaces\Internal\SettingRepositoryInterface;
use App\Interfaces\Internal\ShopRepositoryInterface;
use App\Repositories\Internal\ApiTokenRepository;
use App\Repositories\Internal\CustomerRepository;
use App\Repositories\Internal\FeatureRepository;
use App\Repositories\Internal\InvitationGroupRepository;
use App\Repositories\Internal\InvitationsRepository;
use App\Repositories\Internal\PlanRepository;
use App\Repositories\Internal\SettingRepository;
use App\Repositories\Internal\ShopRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(ShopRepositoryInterface::class, ShopRepository::class);
        $this->app->bind(SettingRepositoryInterface::class, SettingRepository::class);
        $this->app->bind(CustomerRepositoryInterface::class, CustomerRepository::class);
        $this->app->bind(InvitationGroupRepositoryInterface::class, InvitationGroupRepository::class);
        $this->app->bind(InvitationsRepositoryInterface::class, InvitationsRepository::class);
        $this->app->bind(ApiTokenRepositoryInterface::class, ApiTokenRepository::class);
        $this->app->bind(PlanRepositoryInterface::class, PlanRepository::class);
        $this->app->bind(FeatureRepositoryInterface::class, FeatureRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
