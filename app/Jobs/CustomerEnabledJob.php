<?php

namespace App\Jobs;

use App\Models\Customer;
use App\Repositories\Internal\CustomerRepository;
use App\Repositories\Internal\ShopRepository;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CustomerEnabledJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, \Illuminate\Bus\Queueable, SerializesModels;

    public $shop;
    public $customerData;

    /**
     * Create a new job instance.
     */
    public function __construct($shopDomain, $data)
    {
        $this->customerData = $data;
        $this->shop = (new ShopRepository())->getShopByDomain($shopDomain);
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $customerRepository = new CustomerRepository();
        $customer = $customerRepository->getCustomer(
            $this->shop, data_get($this->customerData, 'admin_graphql_api_id'),
            [],
            Customer::GRAPHQL_ID
        );

        if ($customer) {
            $customerRepository->updateCustomer($this->shop, $customer, [
                'state' => Customer::STATE_ENABLED
            ]);
        }
    }
}
