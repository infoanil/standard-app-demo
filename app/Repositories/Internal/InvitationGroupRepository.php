<?php

namespace App\Repositories\Internal;

use App\Exports\InvitationGroupExport;
use App\Helpers\ShopifyHelper;
use App\Interfaces\Internal\InvitationGroupRepositoryInterface;
use App\Jobs\FetchSegmentCustomers;
use App\Models\Invitation;
use App\Models\InvitationGroup;
use App\Models\Plan;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class InvitationGroupRepository implements InvitationGroupRepositoryInterface
{
    public function getInvitationGroups($shop, $params = [])
    {
        $search = data_get($params, 'search');
        $perPage = data_get($params, 'per_page') ?: 20;
        $all = data_get($params, 'all', false);
        $status = data_get($params, 'status') ?: [];
        $sortBy = data_get($params, 'sort_by') ?: 'created_at desc';

        $invitationGroups = InvitationGroup::where('user_id', $shop->id);

        if ($status) {
            $invitationGroups = $invitationGroups->whereIn('status', $status);
        }

        if ($search) {
            $invitationGroups = $invitationGroups->where(function ($query) use ($search) {
                $query->where('name', 'LIKE', '%'.$search.'%');
            });
        }

        if ($sortBy) {
            $sortBy = explode(' ', $sortBy);
            if (count($sortBy) === 2) {
                $invitationGroups = $invitationGroups->orderBy(DB::raw("ISNULL($sortBy[0]), $sortBy[0]"), $sortBy[1]);
            }
        }

        if ($all) {
            return $invitationGroups->get();
        }

        return $invitationGroups->paginate($perPage);
    }

    public function getInvitationGroup($shop, $invitationGroupId, $relations = [])
    {
        $invitationGroup = InvitationGroup::query();
        if ($relations) {
            $invitationGroup = $invitationGroup->with($relations);
        }

        return $invitationGroup->where('user_id', $shop->id)->find($invitationGroupId);
    }

    public function storeInvitationGroup($shop, $input = [])
    {
        $invitationGroup = InvitationGroup::create([
            'user_id'      => $shop->id,
            'name'         => data_get($input, 'name'),
            'segment_id'   => getGraphqlId(data_get($input, 'segment.id'), ShopifyHelper::$SEGMENT),
            'segment_name' => data_get($input, 'segment.name'),
            'status'       => InvitationGroup::STATUS_READY,
            'invite_all_group' => data_get($input, 'invite_all_group'),
        ]);

        dispatch(new FetchSegmentCustomers($shop, $invitationGroup));

        return $invitationGroup;
    }

    public function updateInvitationGroup($shop, InvitationGroup $invitationGroup, $input = [])
    {
        if (empty($input)) {
            return $invitationGroup;
        }

        foreach ($input as $key => $value) {
            $invitationGroup->{$key} = $value;
        }
        $invitationGroup->save();

        return $invitationGroup;
    }

    public function removeInvitationGroup($shop, InvitationGroup $invitationGroup)
    {
        Invitation::where('invitation_group_id', $invitationGroup->id)->delete();
        $invitationGroup->delete();

        return [];
    }

    public function exportInvitationGroup($shop, InvitationGroup $invitationGroup)
    {
        $directoryName = 'invitation_groups';
        if (!Storage::disk('public')->exists($directoryName)) {
            Storage::disk('public')->makeDirectory("/exports/$directoryName");
        }

        $filePaths = [];

        $date = Carbon::now()->timestamp;

        Invitation::where('user_id', $shop->id)
            ->where('invitation_group_id', $invitationGroup->id)
            ->chunk(50000,
                function (Collection $invitations, $index) use (&$filePaths, $directoryName, $invitationGroup, $date) {
                    $fileName = $index === 0 ? $directoryName : "{$directoryName}_$index";
                    Excel::store(new InvitationGroupExport(['name' => $invitationGroup->name], $invitations),
                        "exports/$directoryName/$date/$fileName.xlsx", 'public');
                    $filePaths[] = url("storage/exports/$directoryName/$date/$fileName.xlsx");
                });

        return $filePaths;
    }

    public function calculateProcessCost($shop, InvitationGroup $invitationGroup)
    {
        $totalCustomer = $invitationGroup->invitations()
            ->where('customer_state', '!=', 'ENABLED')
            ->where('status', '!=', 'SENT')
            ->count();

        $enabledCustomers = $invitationGroup->invitations()->where('customer_state', 'ENABLED')->count();
        $isFreePlan = $shop && $shop->plan && $shop->plan->slug === Plan::FREE_PLAN;

        $amount = calculateTotalCharge($totalCustomer, $shop);

        $totalInvited = $shop->invitations()->where('status', 'SENT')->whereNotNull('invitation_group_id')->count('customer_id');
        $lowerLimit = intval(@$shop->invite_limit ?? 5000);
        $adjustmentValue = $lowerLimit - $totalInvited;
        $extraCustomer = $totalCustomer >= $adjustmentValue;
        $isExtra = ($shop->plan && !$isFreePlan) || $shop->development_store ? false : $extraCustomer;
        if (!$shop->plan && !$shop->development_store){
            $isExtra = true;
        }

        return [
            'amount'           => $shop->development_store ? 0 : $amount,
            'customers'        => $totalCustomer,
            'enabledCustomers' => $enabledCustomers,
            'extraCustomer'    => $isExtra,
            'totalInvited'     => $totalInvited,
        ];
    }
}
