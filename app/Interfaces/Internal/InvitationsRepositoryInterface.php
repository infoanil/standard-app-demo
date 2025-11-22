<?php

namespace App\Interfaces\Internal;

use App\Models\Invitation;
use App\Models\InvitationGroup;

interface InvitationsRepositoryInterface
{
    public function getInvitations($shop, $invitationGroupId, $params = []);

    public function storeInvitation($shop, $input = []);

    public function getInvitation($shop, $invitationId, $relations = []);

    public function updateInvitation($shop, Invitation $invitation, $input = []);
}
