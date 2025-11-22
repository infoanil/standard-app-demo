<?php

namespace App\Jobs;

use App\Models\User;
use App\Repositories\Internal\ShopRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;

class AfterAuthenticateJob implements ShouldQueue
{
    use Queueable;

    public $shop;

    /**
     * Create a new job instance.
     */
    public function __construct(User $shop)
    {
        $this->shop = $shop;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        (new ShopRepository())->getAndUpdateShop($this->shop, 'afterAuthenticate');

//        if (!$this->shop->customers()->count()) {
//            Artisan::call("app:sync-customers {$this->shop->name}");
//        }
    }
}
