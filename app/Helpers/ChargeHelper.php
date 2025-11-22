<?php

namespace App\Helpers;

use App\Models\InvitationGroup;
use App\Models\UsageChargeLog;
use App\Models\User;
use Carbon\Carbon;
class ChargeHelper
{
    public static function chargeAttemptForGroups($shop, $charge, $plan, $invitationGroupId = null)
    {
        try {
            if ($invitationGroupId) {
                $invitationGroups = $shop->invitationGroups()->where('id', $invitationGroupId)
                    ->whereIn('status', [InvitationGroup::STATUS_COMPLETED, InvitationGroup::STATUS_CANCELED])
                    ->where('successful', '>', 0)
                    ->get();
            } else {
                $invitationGroups = $shop->invitationGroups()
                    ->whereIn('status', [InvitationGroup::STATUS_COMPLETED, InvitationGroup::STATUS_CANCELED])
                    ->where('successful', '>', 0)
                    ->get();
            }

            $cappedAmount = floatval(@$plan['capped_amount'] ?? 0);

            foreach ($invitationGroups as $invitationGroup) {
                $totalSuccess = intval($invitationGroup->successful);
                $totalCharged = intval($invitationGroup->charged);
                $totalFreeInvited = intval($invitationGroup->free_invites);

                if (!$totalSuccess || $totalCharged >= $totalSuccess) {
                    continue;
                }

                $totalCustomer = $totalSuccess - ($totalCharged + $totalFreeInvited);

                if ($totalCustomer <= 0) {
                    continue;
                }

                $chargeData = calculateTotalCharge($totalCustomer, $shop, false);
                $amount = data_get($chargeData, 'amount');
                $freeInvites = data_get($chargeData, 'free_invites');
                $chargedInvites = data_get($chargeData, 'charged');

                if ($amount <= 0) {

                    if ($freeInvites) {
                        $invitationGroup->update(['free_invites' => $totalFreeInvited + $freeInvites]);
                        $invitationGroup->invitations()->where('status', 'SENT')->whereNull('charged')->update(['charged' => true]);

                        $data = [
                            'charge_id'           => $charge['id'],
                            'invitation_group_id' => $invitationGroup->id,
                            'successful_invites'  => $totalCustomer ?? 0,
                            'amount_charged'      => 0,
                            'notes'               => 'Free invites used',
                            'charged_at'          => Carbon::now(),
                        ];
                        self::logUsageData($shop->id, $data);
                    }

                    continue;
                }

                $month = Carbon::now()->monthName;
                $description = env('SHOPIFY_APP_NAME') . " transaction fees of month $month for group {$invitationGroup->id}";
                $fees = self::triggerUsageCharge($shop, $charge['charge_id'], $amount, $description);

                if ($fees['status']) {
                    $shop->update(['last_charge_date' => Carbon::today()]);

                    $remainingAmount = $fees['data']['balance_remaining'];
                    if ($remainingAmount <= 0) {
                        $shop->plan_limit_status = self::planLimitStatus('hundred_percentage_limit');
                        $shop->save();
                    }

                    if ($remainingAmount <= $cappedAmount * 0.2) {
                        $shop->plan_limit_status = self::planLimitStatus('eighty_percentage_limit');
                        $shop->save();
                    }

                    $data = [
                        'charge_id'           => $charge['id'],
                        'invitation_group_id' => $invitationGroup->id,
                        'successful_invites'  => $totalCustomer ?? 0,
                        'amount_charged'      => $amount,
                        'notes'               => $description,
                        'charged_at'          => Carbon::now(),
                    ];

                    $invitationGroup->update([
                        'charged' => ($totalCharged + $chargedInvites),
                        'free_invites' => ($totalFreeInvited + $freeInvites),
                    ]);

                    $invitationGroup->invitations()->where('status', 'SENT')->whereNull('charged')->update(['charged' => true]);
                } else {
                    $data = [
                        'charge_id'           => $charge['id'],
                        'invitation_group_id' => $invitationGroup->id,
                        'successful_invites'  => $totalCustomer ?? 0,
                        'amount_charged'      => 0,
                        'notes'               => 'error',
                        'charged_at'          => null,
                        'error'               => json_encode($fees['data']),
                    ];
                }

                self::logUsageData($shop->id, $data);
            }
        } catch (\Exception $e) {
            $data = [
                'charge_id'          => $charge['id'],
                'successful_invites' => 0,
                'amount_charged'     => 0,
                'notes'              => 'error from group attempt',
                'error'              => $e->getMessage(),
            ];
            self::logUsageData($shop->id, $data);
        }
    }

    private static function logUsageData($shopId, $data)
    {
        UsageChargeLog::create([
            'user_id'             => $shopId,
            'charge_id'           => @$data['charge_id'],
            'invitation_group_id' => @$data['invitation_group_id'],
            'successful_invites'  => @$data['successful_invites'],
            'amount_charged'      => @$data['amount_charged'],
            'notes'               => @$data['notes'],
            'charged_at'          => @$data['charged_at'],
            'error'               => @$data['error'],
        ]);
    }

    public static function triggerUsageCharge(User $shop, $chargeId, $amount, $description)
    {
        try {
            $usageChargeData = [
                "usage_charge" => [
                    "description" => $description,
                    "price"       => $amount,
                ],
            ];
            $usageCharge = $shop->api()->rest('POST',
                "/admin/api/recurring_application_charges/$chargeId/usage_charges.json", $usageChargeData);
            if (!$usageCharge['errors']) {
                return ['data' => @$usageCharge['body']['usage_charge']->toArray(), 'status' => true];
            } else {
                return ['data' => $usageCharge['body'], 'status' => false];
            }
        } catch (\Exception $exception) {
            report($exception->getMessage());

            return ['data' => $exception->getMessage(), 'status' => false];
        }
    }

    public static function planLimitStatus($status = null)
    {
        $sentLimitsStatus = [
            'full_limit'               => 0,
            'eighty_percentage_limit'  => 1,
            'hundred_percentage_limit' => 2,
        ];

        if ($status !== null) {
            return $sentLimitsStatus[$status];
        }

        return $sentLimitsStatus;
    }
}
