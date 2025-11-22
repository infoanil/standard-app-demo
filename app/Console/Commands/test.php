<?php

namespace App\Console\Commands;

use App\Helpers\SettingHelper;
use App\Models\Invitation;
use App\Models\InvitationGroup;
use App\Models\Setting;
use App\Models\User;
use App\Repositories\Internal\SettingRepository;
use App\Services\ShopifyService;
use Illuminate\Console\Command;

class test extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test';

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
        $shop = User::first();
        $shopifyService = new ShopifyService($shop);
        $response = $shopifyService->getUsageChargeDetails();

        dd($response);

        dd(json_encode( [
        "gid://shopify/Product/6564311466046",
        "gid://shopify/Product/7165977591870",
        "gid://shopify/Product/7823720906814",
        "gid://shopify/Product/7823721070654"
    ]));
        $shop = User::find(1);
        $invitationGroups = $shop->invitationGroups()
            ->whereIn('status', [InvitationGroup::STATUS_COMPLETED, InvitationGroup::STATUS_CANCELED])
            ->where('successful', '>', 0)
            ->get();
        dd($invitationGroups->pluck('id')->toArray());
        $shop = User::find(1);
        dd($shop->plan->features()->pluck('slug')->toArray());
        $grp = InvitationGroup::find(1);
        dd($grp->usageChargeLogs->toArray());
        $totalInvites = 1500;
        $shop = User::first();
        $amount = calculateTotalCharge($totalInvites, $shop, false);
        dd($amount);
    }
}
