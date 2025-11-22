<?php namespace App\Jobs;

use App\Mail\CustomerRequestMail;
use App\Models\Customer;
use App\Repositories\Internal\ShopRepository;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Osiset\ShopifyApp\Objects\Values\ShopDomain;
use stdClass;

class CustomersDataRequestJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Shop's myshopify domain
     *
     * @var ShopDomain|string
     */
    public $shop;

    /**
     * The webhook data
     *
     * @var object
     */
    public $data;

    /**
     * Create a new job instance.
     *
     * @param string   $shopDomain The shop's myshopify domain.
     * @param stdClass $data       The webhook data (JSON decoded).
     *
     * @return void
     */
    public function __construct($shopDomain, $data)
    {
        $this->shop = (new ShopRepository())->getShopByDomain($shopDomain);
        $this->data = $data;
    }
    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $email = @$this->data->customer->email;
        $requestedId = @$this->data->data_request->id;
;
        $customer = null;
        if ($requestedId) {
            $graphId = "gid://shopify/Customer/$requestedId";
            $customer = Customer::where('graphql_id', $graphId)->first();
        }
        if (!$customer) {
            $customer = Customer::where('user_id', @$this->shop->id)->where('email', $email)->first();
        }

        if ($customer) {
            Mail::to(@$this->shop->email)->send(new CustomerRequestMail($this->shop, $customer));
        }
    }
}
