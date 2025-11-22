<?php

namespace App\Jobs;

use App\Helpers\ShopifyHelper;
use App\Models\BulkOperation;
use App\Models\Customer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncBulkCustomersJob implements ShouldQueue
{
    use Queueable;

    public $shop;
    public $bulkOperation;

    /**
     * Create a new job instance.
     */
    public function __construct($shop, $bulkOperation)
    {
        $this->shop = $shop;
        $this->bulkOperation = $bulkOperation;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        useMoreMemory();

        $dbCustomers = [];

        Customer::where('user_id', $this->shop->id)->select('id', 'graphql_id')
            ->chunk(15000, function ($chunk) use (&$dbCustomers) {
            foreach ($chunk as $row) {
                $dbCustomers[$row->graphql_id] = $row->id;
            }
        });

        $url = data_get($this->bulkOperation, 'url');

        $createCustomers = [];
        $updateCustomers = [];
        $counter = 0;

        $stream = fopen($url, 'r');
        while (($line = fgets($stream)) !== false) {
            try {
                $line = trim($line);
                if ($line === '') {
                    continue;
                }

                $line = json_decode($line, true);

                if (empty(data_get($line, 'email'))) {
                    continue;
                }

                $line = [
                    'user_id' => data_get($this->shop, 'id'),
                    'graphql_id' => data_get($line, 'id'),
                    'first_name' => data_get($line, 'firstName') ?: null,
                    'last_name' => data_get($line, 'lastName') ?: null,
                    'email' => data_get($line, 'email'),
                    'state' => data_get($line,'state'),
                    'tags' => json_encode(ShopifyHelper::tags(data_get($line,'tags'))),
                    'source_created_at' => Carbon::parse(data_get($line,'createdAt')),
                    'updated_at' => now(),
                ];

                $existingCustomerId = data_get($dbCustomers, data_get($line, 'graphql_id'));
                if ($existingCustomerId) {
                    $line['id'] = $existingCustomerId;
                    $updateCustomers[] = $line;
                } else {
                    $line['created_at'] = now();
                    $createCustomers[] = $line;
                }

                if ((count($createCustomers) + count($updateCustomers)) > 500) {

                    if ($createCustomers) {
                        Customer::insert($createCustomers);
                    }

                    if ($updateCustomers) {
                        bulkUpdate('customers', $updateCustomers);
                    }

                    $counter++;
                    $createCustomers = [];
                    $updateCustomers = [];

                    if ($counter % 10 === 0 || $counter % 50 === 0) {
                        sleep(1);
                    }
                }
            } catch (\Exception $e) {
                report($e);
            }
        }
        fclose($stream);

        sleep(1);

        if ($createCustomers) {
            Customer::insert($createCustomers);
        }

        if ($updateCustomers) {
            bulkUpdate('customers', $updateCustomers);
        }

        sleep(1);

        $this->bulkOperation->sync_status = BulkOperation::STATUS_COMPLETED;
        $this->bulkOperation->save();
    }
}
