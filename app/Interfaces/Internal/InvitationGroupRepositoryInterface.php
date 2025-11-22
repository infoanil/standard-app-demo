<?php

namespace App\Interfaces\Internal;

use App\Models\InvitationGroup;

interface InvitationGroupRepositoryInterface
{
    public function getInvitationGroups($shop, $params = []);

    public function storeInvitationGroup($shop, $input = []);

    public function updateInvitationGroup($shop, InvitationGroup $invitationGroup, $input = []);

    public function getInvitationGroup($shop, $invitationGroupId, $relations = []);

    public function removeInvitationGroup($shop, InvitationGroup $invitationGroup);

    public function exportInvitationGroup($shop, InvitationGroup $invitationGroup);

    public function calculateProcessCost($shop, InvitationGroup $invitationGroup);
}
