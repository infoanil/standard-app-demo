<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ShopifyService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CreateShopifyCustomers extends Command
{
    protected $signature = 'shopify:create-customers {domain}';
    protected $description = 'Create 100 customers in Shopify via GraphQL API';

    public function handle(): void
    {

        $shop = User::where('name', $this->argument('domain'))->first();
        $shopifyService = new ShopifyService($shop);

        if (!$shop) {
            info("Shop now available with name => {$this->argument('domain')}");
        }

        $entries = [
            ['name' => 'Chirag', 'emailBase' => 'chiragg.octal8@gmail.com'],
            ['name' => 'Het', 'emailBase' => 'gabbarhps@gmail.com'],
            ['name' => 'Het Shah', 'emailBase' => 'gabbarhps@gmail.com'],
            ['name' => 'parmarchirag2129', 'emailBase' => 'parmarchirag2129@gmail.com'],
            ['name' => 'kansara', 'emailBase' => 'kansara.naitik.25@ail.com'],
            ['name' => 'Herry', 'emailBase' => 'Herry.dalwala.566@gmail.com'],
            ['name' => 'Nikhilchotaliya001', 'emailBase' => 'Nikhilchotaliya001@gmail.com'],
            ['name' => 'solankimahu', 'emailBase' => 'solankimahu@gmail.com'],
            ['name' => 'rajagrawal67411', 'emailBase' => 'rajagrawal67411@gmail.com'],
            ['name' => 'chudasamaanu', 'emailBase' => 'chudasamaanu@gmail.com'],
            ['name' => 'Infiniftytraders', 'emailBase' => 'Infiniftytraders@gmail.com'],
        ];

        foreach ($entries as $entry) {
            $nameBase = $entry['name'];
            [$emailPrefix, $emailDomain] = explode('@', $entry['emailBase']);

            for ($i = 1; $i <= 40000; $i++) {
                $email = "{$emailPrefix}+{$i}@{$emailDomain}";
                $fullName = "{$nameBase} {$i}";

                try {
                    $response = $shopifyService->createCustomers($email, $fullName);
                    $customer = data_get($response, 'body.data.customerCreate.customer');

                    if (empty($customer)) {
                        $errorMessage = data_get($response, 'body.data.customerCreate.userErrors.0.message', "Unknown error.");
                        Log::error("Failed to create customer {$email}: " . json_encode($errorMessage));
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to create customer {$email}: {$e->getMessage()}");
                }

                if ($i % 50 === 0) {
                    sleep(1);
                }

                if ($i % 1000 === 0) {
                    info("Customers created: $nameBase => $i");
                }
            }
        }

        info("All customers processed.");
    }
}
