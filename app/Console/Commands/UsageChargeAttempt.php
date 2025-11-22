<?php

namespace App\Console\Commands;

use App\Helpers\ChargeHelper;
use App\Models\Plan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class UsageChargeAttempt extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shop:attempt-usage-charge';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Usage charge attempt based on sent invitation';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $shops = User::whereNotNull('password')->get();

        foreach ($shops as $shop) {
            if ($shop->development_store) continue;

            $plan = $shop->plan;
            $charge = $shop->charges()->where('status', 'ACTIVE')->first();

            if (!$charge || !$plan || $plan->slug === Plan::FREE_PLAN) continue;

            $activatedDate = $charge['activated_on'] ?? null;

            if (!$activatedDate) continue;

            $from = Carbon::parse(date('Y-m-d', strtotime($activatedDate)));
            $to = Carbon::now();

            if ($from->diffInDays($to) > 30 && $shop->plan_limit_status > 0) {
                $shop->plan_limit_status = ChargeHelper::planLimitStatus('full_limit');
                $shop->save();
            }

            ChargeHelper::chargeAttemptForGroups($shop, $charge, $plan);
        }
    }
}
