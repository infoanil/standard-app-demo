<?php

namespace App\Console\Commands;

use App\Models\Feature;
use App\Models\Plan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedPlansWithFeatures extends Command
{
    protected $signature = 'seed:plans-features';
    protected $description = 'Seed predefined plans and features with specific values';

    public function handle(): void
    {
        $this->info('Clearing existing data...');
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('feature_plan')->truncate();
        DB::table('features')->truncate();
        DB::table('plans')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $this->info('Seeding features...');
        $featuresData = [
            [
                'id' => 1,
                'name' => 'Onetime Free Invites',
                'slug' => 'onetime-free-invites',
                'type' => 'number',
                'display_order' => 1,
                'hidden_feature' => false,
            ],
            [
                'id' => 2,
                'name' => 'Send Bulk Invites',
                'slug' => 'bulk-invites',
                'type' => 'bool',
                'display_order' => 2,
                'hidden_feature' => false,
            ],
            [
                'id' => 3,
                'name' => 'Frontend Login Helper',
                'slug' => 'login-helper',
                'type' => 'bool',
                'display_order' => 4,
                'hidden_feature' => false,
            ],
            [
                'id' => 4,
                'name' => 'Login as Customer',
                'slug' => 'multipass-login',
                'type' => 'bool',
                'display_order' => 5,
                'hidden_feature' => false,
            ],
            [
                'id' => 5,
                'name' => 'Auto invites via Shopify Flow',
                'slug' => 'shopify-flow',
                'type' => 'bool',
                'display_order' => 3,
                'hidden_feature' => false,
            ],
        ];

        $featureModels = [];
        foreach ($featuresData as $featureData) {
            $feature = Feature::create($featureData);
            $featureModels[$feature->slug] = $feature;
        }

        $this->info('Seeding plans...');
        $plansData = [
            [
                'id' => 1,
                'type' => 'RECURRING',
                'name' => 'Free',
                'slug' => 'bulk-invite',
                'description' => 'Get started with bulk customer invitations at no cost. This Plan lets you send up to 5,000 invitations for free, with no hidden charges. A simple way to re-engage your customers with no fees or hidden costs.',
                'public' => true,
                'price' => 0.00,
                'interval' => null,
                'capped_amount' => 0,
                'terms' => '',
                'trial_days' => 0,
                'test' => false,
                'on_install' => false,
                'discount' => null,
                'invite_limit' => 5000
            ],
            [
                'id' => 2,
                'type' => 'RECURRING',
                'name' => 'Pro Plan (Legacy)',
                'slug' => 'pro-old',
                'description' => 'Includes all features of the Bulk Invite plan, plus advanced tools like Login Helper and Multipass Login support—perfect for growing businesses needing enhanced customer engagement.',
                'public' => true,
                'price' => 14.99,
                'interval' => null,
                'capped_amount' => 1000.00,
                'terms' => 'Free up to 100 invites. After that, pay only for what you use. For example: 101–1,000 invites at $0.004 per invite, 1,001–10,000 at $0.0025 per invite. Additional tiers available below.',
                'trial_days' => 0,
                'test' => false,
                'on_install' => false,
                'discount' => null,
            ],
            [
                'id' => 3,
                'type' => 'RECURRING',
                'name' => 'Pro Plan',
                'slug' => 'pro',
                'description' => 'Includes all features of the Bulk Invite plan, plus advanced tools like Login Helper and Multipass Login support—perfect for growing businesses needing enhanced customer engagement.',
                'public' => true,
                'price' => 9.99,
                'interval' => null,
                'capped_amount' => 50.00,
                'terms' => 'Free up to 5000 invites. After that, pay only for what you use. For example: $0.001 per invite.',
                'trial_days' => 0,
                'test' => false,
                'on_install' => false,
                'invite_limit' => 5000,
                'discount' => [
                    'amount' => 5
                ],
            ],
        ];

        foreach ($plansData as $planData) {
            $plan = Plan::create($planData);

            if ($plan->slug === 'bulk-invite') {
                $plan->features()->attach($featureModels['onetime-free-invites']->id, ['value' => 5000]);
                $plan->features()->attach($featureModels['bulk-invites']->id, ['value' => true]);
                $plan->features()->attach($featureModels['shopify-flow']->id, ['value' => true]);
            }

            if ($plan->slug === 'pro' || $plan->slug === 'pro-old') {
                $plan->features()->attach($featureModels['onetime-free-invites']->id, ['value' => $plan->slug === 'pro-old' ? 100 : 5000]);
                $plan->features()->attach($featureModels['bulk-invites']->id, ['value' => true]);
                $plan->features()->attach($featureModels['login-helper']->id, ['value' => true]);
                $plan->features()->attach($featureModels['multipass-login']->id, ['value' => true]);
                $plan->features()->attach($featureModels['shopify-flow']->id, ['value' => true]);
            }

            $this->info("Seeded plan: {$plan->name}");
        }

        $this->info('🔄 Clearing cache...');
        cache()->forget('plans.public.normalized');

        foreach (range(1, 3) as $planId) {
            cache()->forget("plans.assigned.$planId");
        }
        $this->info('✅ Plans and features seeded successfully.');
    }
}
