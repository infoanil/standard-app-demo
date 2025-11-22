<?php namespace App\Jobs;

use App\Helpers\ShopifyHelper;
use App\Models\Customer;
use App\Repositories\Internal\ShopRepository;
use App\Services\ShopifyService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CustomerCreateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $shop;

    public $customerData;

    public function __construct($shopDomain, $data)
    {
        $this->customerData = $data;
        $this->shop = (new ShopRepository())->getShopByDomain($shopDomain);
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $customerData = $this->customerData;

        $email = data_get($customerData, 'email');
        if (empty($email)) {
            return;
        }

        $shopifyService = new ShopifyService($this->shop);

        $shopifyCustomer = $shopifyService->getCustomer([
            'identifier' => [
                'emailAddress' => $email,
            ],
        ]);

        $shopifyCustomer = data_get($shopifyCustomer, 'body.data.customer') ?: null;

        Customer::updateOrCreate([
            'user_id'    => $this->shop->id,
            'graphql_id' => data_get($customerData, 'admin_graphql_api_id'),
        ], [
            'first_name'        => data_get($customerData, 'first_name') ?: null,
            'last_name'         => data_get($customerData, 'last_name') ?: null,
            'email'             => $email,
            'state'             => strtoupper(data_get($customerData, 'state')),
            'tags'              => ShopifyHelper::tags(data_get($shopifyCustomer, 'tags')),
            'source_created_at' => Carbon::parse(data_get($customerData, 'created_at')),
            'updated_at'        => now(),
        ]);
    }
}
