<?php

namespace App\Repositories\Internal;

use App\Interfaces\Internal\InvitationsRepositoryInterface;
use App\Models\Invitation;
use Illuminate\Support\Facades\DB;

class InvitationsRepository implements InvitationsRepositoryInterface
{
    public function getInvitations($shop, $invitationGroupId, $params = [])
    {
        $search = data_get($params, 'search');
        $perPage = data_get($params, 'per_page') ?: 20;
        $all = data_get($params, 'all', false);
        $status = data_get($params, 'status') ?: [];
        $sortBy = data_get($params, 'sort_by') ?: 'created_at desc';

        $invitations = Invitation::where('user_id', $shop->id)->where('invitation_group_id', $invitationGroupId);

        if ($status) {
            $invitations = $invitations->whereIn('status', $status);
        }

        if ($search) {
            $invitations = $invitations->where(function ($query) use ($search) {
                $query->where('customer_name', 'LIKE', '%'. $search. '%')
                    ->orWhere('email', 'LIKE', '%'. $search. '%')
                    ->orWhere('customer_id', 'LIKE', '%'. $search. '%');
            });
        }

        if ($sortBy) {
            $sortBy = explode(' ', $sortBy);
            if (count($sortBy) === 2) {
                $invitations = $invitations->orderBy(DB::raw("ISNULL($sortBy[0]), $sortBy[0]"), $sortBy[1]);
            }
        }

        if ($all) {
            return $invitations->get();
        }

        return $invitations->paginate($perPage);
    }

    public function storeInvitation($shop, $input = [])
    {
        $invitation = new Invitation();
        foreach ($input as $key => $value) {
            $invitation->{$key} = $value;
        }
        $invitation->save();

        return $invitation;
    }

    public function getInvitation($shop, $invitationId, $relations = [])
    {
        $invitationGroup = Invitation::query();
        if ($relations) {
            $invitationGroup = $invitationGroup->with($relations);
        }
        return $invitationGroup->where('user_id', $shop->id)->find($invitationId);
    }

    public function updateInvitation($shop, Invitation $invitation, $input = [])
    {
        foreach ($input as $key => $value) {
            $invitation->{$key} = $value;
        }
        $invitation->save();

        return $invitation;
    }
}
