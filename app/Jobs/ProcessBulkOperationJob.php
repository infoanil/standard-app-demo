<?php

namespace App\Jobs;

use App\Helpers\ShopifyHelper;
use App\Models\BulkOperation;
use App\Models\Customer;
use App\Services\ShopifyService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProcessBulkOperationJob implements ShouldQueue
{
    use Queueable;

    public $shop;
    public $bulkOperationId;

    /**
     * Create a new job instance.
     */
    public function __construct($shop, $bulkOperationId)
    {
        $this->shop = $shop;
        $this->bulkOperationId = $bulkOperationId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $bulkOperation = BulkOperation::where('graphql_id', $this->bulkOperationId)->where('status', BulkOperation::STATUS_CREATED)->first();

        if (!$bulkOperation) {
            Log::error("Unable to find bulk operation in database for $this->bulkOperationId");
            return;
        }

        $shopifyService = new ShopifyService($this->shop);
        $response = $shopifyService->getBulkOperation($this->bulkOperationId);

        if (data_get($response, 'errors') || !data_get($response, 'body.data.node')) {
            $error = 'Unable to retrieve bulk operation';
            Log::error($error);
            Log::error(json_encode($response));

            $bulkOperation->sync_status = BulkOperation::STATUS_FAILED;
            $bulkOperation->error = json_encode(json_encode(['message' => $error, 'response' => $response]));
            $bulkOperation->save();
            return;
        }

        $liveBulkOperation =  data_get($response, 'body.data.node');
        $operationStatus = data_get($liveBulkOperation, 'status');

        if ($operationStatus === BulkOperation::STATUS_CREATED || $operationStatus === BulkOperation::STATUS_RUNNING) {
            Log::debug("Bulk operation $this->bulkOperationId is $operationStatus");
            return;
        }

        if (!data_get($liveBulkOperation, 'url')) {
            $error = 'Unable to retrieve bulk operation url';
            Log::error($error);
            Log::error(json_encode($response));

            $bulkOperation->status = $operationStatus;
            $bulkOperation->error_code = data_get($liveBulkOperation, 'errorCode') ?: null;
            $bulkOperation->sync_status = BulkOperation::STATUS_FAILED;
            $bulkOperation->error = json_encode(json_encode(['message' => $error, 'response' => $response]));
            $bulkOperation->save();
            return;
        }

        $bulkOperation->status = $operationStatus;
        $bulkOperation->url = data_get($liveBulkOperation, 'url') ?: null;
        $bulkOperation->object_count = data_get($liveBulkOperation, 'objectCount') ?: null;
        $bulkOperation->root_object_count = data_get($liveBulkOperation, 'rootObjectCount') ?: 0;
        $bulkOperation->error_code = data_get($liveBulkOperation, 'errorCode') ?: null;
        $bulkOperation->save();

        if ($bulkOperation->type === BulkOperation::TYPE_CUSTOMERS) {
            SyncBulkCustomersJob::dispatch($this->shop, $bulkOperation);
        }
    }
}
