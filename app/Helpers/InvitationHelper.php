<?php

namespace App\Helpers;

use Illuminate\Support\Carbon;

class InvitationHelper
{
    public static function prepareInvitations($data): array
    {
        return [
            'user_id' => data_get($data, 'user_id'),
            'invitation_group_id' => data_get($data, 'invitation_group_id'),
            'customer_id' => data_get($data, 'graphql_id'),
            'email' => data_get($data, 'email'),
            'customer_name' => trim(data_get($data, 'first_name') . ' ' . data_get($data, 'last_name')),
            'customer_state' => data_get($data, 'state'),
            'updated_at' => Carbon::now(),
        ];
    }
}
