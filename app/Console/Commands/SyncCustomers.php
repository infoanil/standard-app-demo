<?php

namespace App\Console\Commands;

use App\Models\BulkOperation;
use App\Models\User;
use App\Services\ShopifyService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncCustomers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-customers {domain}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $shop = User::where('name', $this->argument('domain'))->first();
        $shopifyService = new ShopifyService($shop);
        $response = $shopifyService->runBulkOperation(
            'customers {
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
                }
            }'
        );

        if (data_get($response, 'errors')) {
            Log::error(data_get($response, 'body'));
            return;
        }
        if (data_get($response, 'body.data.bulkOperationRunQuery.userErrors')) {
            Log::error(json_encode(data_get($response, 'body')));
            return;
        }

        $bulkOperation = data_get($response, 'body.data.bulkOperationRunQuery.bulkOperation');
        if (!$bulkOperation) {
            Log::error('Failed to create bulk operation for customers');
            return;
        }

        BulkOperation::create([
            'user_id' => $shop->id,
            'type' => BulkOperation::TYPE_CUSTOMERS,
            'graphql_id' => data_get($bulkOperation, 'id'),
            'status' => data_get($bulkOperation, 'status'),
            'sync_status' => BulkOperation::STATUS_CREATED,
        ]);
    }
}
