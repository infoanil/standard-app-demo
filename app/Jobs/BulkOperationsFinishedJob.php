<?php

namespace App\Jobs;

use App\Repositories\Internal\ShopRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class BulkOperationsFinishedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $shop;
    public $bulkOperation;

    /**
     * Create a new job instance.
     */
    public function __construct($shopDomain, $data)
    {
        $this->bulkOperation = $data;
        $this->shop = (new ShopRepository())->getShopByDomain($shopDomain);
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        ProcessBulkOperationJob::dispatch($this->shop, data_get($this->bulkOperation, 'admin_graphql_api_id'));
    }
}
