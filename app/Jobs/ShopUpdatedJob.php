<?php

namespace App\Jobs;

use App\Repositories\Internal\ShopRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ShopUpdatedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, \Illuminate\Bus\Queueable, SerializesModels;

    public $shop;
    public $shopData;

    /**
     * Create a new job instance.
     */
    public function __construct($shopDomain, $data)
    {
        $this->shopData = $data;
        $this->shop = (new ShopRepository())->getShopByDomain($shopDomain);
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (!$this->shopData) return;

        (new ShopRepository())->updateShop($this->shop, [
            'email' => data_get($this->shopData, 'email'),
        ]);

        (new ShopRepository())->getAndUpdateShop($this->shop);
    }
}
