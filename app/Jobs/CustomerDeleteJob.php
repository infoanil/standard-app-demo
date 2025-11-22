<?php namespace App\Jobs;

use App\Models\Customer;
use App\Repositories\Internal\CustomerRepository;
use App\Repositories\Internal\ShopRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CustomerDeleteJob implements ShouldQueue
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
        $customerRepository = new CustomerRepository();
        $customer = $customerRepository->getCustomer(
            $this->shop, data_get($this->customerData, 'admin_graphql_api_id'),
            [],
            Customer::GRAPHQL_ID
        );

        if ($customer) {
            $customer->delete();
        }
    }
}
