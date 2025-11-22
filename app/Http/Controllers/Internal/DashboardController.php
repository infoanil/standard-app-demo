<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invitation;
use App\Models\InvitationGroup;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\UsageChargeLog;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $shop = $request->user();

        $counts = $shop->customers()
            ->select('state', \DB::raw('count(*) as count'))
            ->groupBy('state')
            ->pluck('count', 'state');

        $total = $counts->sum();
        $enabled = $counts[Customer::STATE_ENABLED] ?? 0;
        $disabled = $counts[Customer::STATE_DISABLED] ?? 0;
        $invited = $counts[Customer::STATE_INVITED] ?? 0;
        $allInvitedOnce = $shop->invitationGroups()->where('invite_all_group', 1)->where('status', InvitationGroup::STATUS_IN_PROGRESS)->exists();
        $isInvitationGroup = InvitationGroup::where('user_id', $shop->id)->exists();
        $isSettingDone = Setting::where('user_id', $shop->id)->where('key', 'token')->whereNotNull('value')->exists();
        $totalUsageCharge = UsageChargeLog::where('user_id', $shop->id)->sum('amount_charged');
        $totalSentInvitations = $shop->invitations()->where('status', 'SENT')->count('customer_id');
        $today = now()->toDateString();
        $lastShown = $shop->trial_modal_shown_at ? Carbon::parse($shop->trial_modal_shown_at)->toDateString() : null;
        $shouldShow = (!$lastShown || $lastShown !== $today) && $shop->is_trial_active && !$shop->plan_id;

        $shop->trial_modal_shown_at = now()->toDateString();
        $shop->save();

        return preparedResponse([
            'customers'          => $total,
            'enabledCustomers'   => $enabled,
            'disabledCustomers'  => $disabled,
            'invitedCustomers'   => $invited,
            'allInvitedOnce'     => $allInvitedOnce,
            'isInvitationGroup'  => $isInvitationGroup,
            'isSettingDone'      => $isSettingDone,
            'totalUsageCharge'   => $totalUsageCharge,
            'themeCustomization' => $shop->onboarding,
            'showTrialModal'     => $shouldShow,
            'totalSentInvitations' =>$totalSentInvitations
        ]);
    }

    public function calculateInviteCost(Request $request)
    {
        $shop = $request->user();
        $totalCustomer = $shop->customers()->where('state', 'DISABLED')->count();
        $enabledCustomers = $shop->customers()->where('state', 'ENABLED')->count();
        $amount = calculateTotalCharge($totalCustomer, $shop);
        $isFreePlan = $shop && $shop->plan && $shop->plan->slug === Plan::FREE_PLAN;

        $totalInvited = $shop->invitations()->where('status', 'SENT')->whereNotNull('invitation_group_id')->count('customer_id');
        $lowerLimit = intval(@$shop->invite_limit ?? 5000);
        $adjustmentValue = $lowerLimit - $totalInvited;
        $extraCustomer = $totalCustomer >= $adjustmentValue;
        $isExtra = ($shop->plan && !$isFreePlan) || $shop->development_store ? false : $extraCustomer;
        if (!$shop->plan && !$shop->development_store){
            $isExtra = true;
        }

        return [
            'amount'           => $amount,
            'customers'        => $totalCustomer,
            'enabledCustomers' => $enabledCustomers,
            'extraCustomer'    => $isExtra,
            'totalInvited'     => $totalInvited,
        ];
    }

    public function usageCharges(Request $request)
    {
        $shop = $request->user();
        $invitationGroups = $shop->invitationGroups()
            ->whereIn('status', [InvitationGroup::STATUS_COMPLETED, InvitationGroup::STATUS_CANCELED])
            ->where('successful', '>', 0)
            ->with('usageChargeLogs')
            ->get()
            ->map(function ($group) use ($shop) {
                $chargedCustomer = $group->charged ?? 0;
                if ($group->successful > $chargedCustomer) {
                    $pendingInvites = $group->successful - $chargedCustomer;
                    $group->pending_charge_amount = calculateTotalCharge($pendingInvites, $shop);
                } else {
                    $group->pending_charge_amount = 0;
                }

                $group->amount_charged = $group->usageChargeLogs->sum('amount_charged');
                $group->charged_at = @$group->usageChargeLogs()->whereNotNull('charged_at')->first()->charged_at;

                return $group;
            });

        return preparedResponse([
            'groupWithCharge'  => $invitationGroups,
        ]);
    }

    public function onboard(Request $request)
    {
        $shop = $request->user();
        if (!$shop->onboarding) {
            $shop->onboarding = 1;
            $shop->save();
        }

        return preparedResponse([
            'message' => 'Theme customization enabled.',
        ]);
    }

    public function activities(Request $request)
    {
        $startDate = Carbon::parse($request->startDate ?? now()->subDays(14))->startOfDay();
        $endDate = Carbon::parse($request->endDate ?? now())->endOfDay();

        // Step 1: Query grouped counts
        $data = Invitation::query()
            ->where('user_id', $request->user()->id)
            ->where('status', Invitation::STATUS_SENT)
            ->selectRaw('DATE(created_at) as date, source, COUNT(*) as total')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupByRaw('DATE(created_at), source')
            ->orderByRaw('DATE(created_at)')
            ->get();

        // Step 2: Create structure with all dates in range
        $grouped = [];

        $adminKey = Invitation::SOURCE_ADMIN;
        $frontendKey = Invitation::SOURCE_FRONTEND;
        $flowKey = Invitation::SOURCE_FLOW;

        $period = \Carbon\CarbonPeriod::create($startDate, $endDate);
        foreach ($period as $date) {
            $label = $date->format('M j'); // e.g., "Jul 09"
            $grouped[$label] = [
                'name'  => $label,
                $adminKey => 0,
                $frontendKey => 0,
                $flowKey => 0,
                'all'   => 0,
            ];
        }

        // Step 3: Fill data from DB results
        foreach ($data as $row) {
            $label = Carbon::parse($row->date)->format('M j');

            if (!isset($grouped[$label])) {
                continue;
            }

            if ($row->source === $adminKey) {
                $grouped[$label][$adminKey] = $row->total;
            }
            elseif ($row->source === $frontendKey) {
                $grouped[$label][$frontendKey] = $row->total;
            }
            elseif ($row->source === $flowKey) {
                $grouped[$label][$flowKey] = $row->total;
            }

            $grouped[$label]['all'] = $grouped[$label][$adminKey] + $grouped[$label][$frontendKey] + $grouped[$label][$flowKey];
        }

        return array_values($grouped);
    }

}
