<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ManageWebhooks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'manage-webhooks {domain}';

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

        if (!$shop) {
            $this->error('Shop not found');
            return;
        }

        try {
            $response = $shop->api()->rest('GET', '/admin/api/2025-01/webhooks.json');

            if ($response['errors']) {
                return response()->json(['error' => $response['body']], 400);
            }

            $currentWebhooks = $response['body']['webhooks'] ?? [];
            $existingTopics = collect($currentWebhooks)->pluck('topic')->toArray();
            $baseUrl = trim(env('APP_WEBHOOK_URL', ''), '/');

            $requiredWebhooks = [
                [
                    'topic' => 'customers/create',
                    'address' => "$baseUrl/webhook/customer-create",
                    'format' => 'json'
                ],
                [
                    'topic' => 'customers/delete',
                    'address' => "$baseUrl/webhook/customer-delete",
                    'format' => 'json'
                ]
            ];

            foreach ($requiredWebhooks as $webhookData) {
                if (!in_array($webhookData['topic'], $existingTopics)) {
                    $this->info("Creating webhook for: {$webhookData['topic']}");

                    $createResponse = $shop->api()->rest('POST', '/admin/api/2025-01/webhooks.json', [
                        'webhook' => $webhookData
                    ]);

                    if (!empty($createResponse['errors'])) {
                        $this->error("Failed to create webhook for {$webhookData['topic']}: " . json_encode($createResponse['body']));
                    } else {
                        $this->info("Successfully created webhook for {$webhookData['topic']}");
                    }
                } else {
                    $this->info("Webhook for {$webhookData['topic']} already exists. Skipping.");
                }
            }

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
        }
    }
}
