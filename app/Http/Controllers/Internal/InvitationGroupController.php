<?php

namespace App\Http\Controllers\Internal;

use App\Helpers\InvitationHelper;
use App\Http\Controllers\Controller;
use App\Interfaces\Internal\InvitationGroupRepositoryInterface;
use App\Jobs\ProcessInvitationGroupJob;
use App\Models\Customer;
use App\Models\Invitation;
use App\Models\InvitationGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InvitationGroupController extends Controller
{
    private InvitationGroupRepositoryInterface $invitationGroupRepository;

    public function __construct(InvitationGroupRepositoryInterface $invitationGroupRepository)
    {
        $this->invitationGroupRepository = $invitationGroupRepository;
    }

    /**
     * Get all invitation groups with records.
     */
    public function index(Request $request)
    {
        $params = $request->all();
        if (!data_get($params, 'per_page')) {
            $params['per_page'] = 20;
        }

        return preparedResponse([
            'invitation_groups' => $this->invitationGroupRepository->getInvitationGroups($request->user(), $params),
        ]);
    }

    /**
     * Store a new invitation group.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'segment'      => 'required|array',
            'segment.id'   => 'required',
            'segment.name' => 'required',
            'name'         => 'required',
        ]);

        $invitationGroup = $this->invitationGroupRepository->storeInvitationGroup($request->user(), $request->all());

        return preparedResponse(['invitation_group' => $invitationGroup], 201);
    }

    /**
     * Update an invitation group.
     */
    public function update(Request $request, $invitationGroupId): JsonResponse
    {
        $request->validate([
            'name' => 'required',
        ]);

        $invitationGroup = $this->invitationGroupRepository->getInvitationGroup($request->user(), $invitationGroupId);
        if (!$invitationGroup) {
            return preparedResponse('Invitation group not found', 404, true);
        }

        $invitationGroup = $this->invitationGroupRepository->updateInvitationGroup(
            $request->user(),
            $invitationGroup,
            $request->all()
        );

        return preparedResponse(['invitation_group' => $invitationGroup]);
    }

    /**
     * Get details of a single invitation group with all invitations.
     */
    public function show(Request $request, $invitationGroupId): JsonResponse
    {
        $invitationGroup = $this->invitationGroupRepository->getInvitationGroup($request->user(), $invitationGroupId);
        if (!$invitationGroup) {
            return preparedResponse('Invitation group not found', 404, true);
        }

        return preparedResponse(['invitation_group' => $invitationGroup]);
    }

    /**
     * Delete an invitation group and its associated invitations.
     */
    public function destroy(Request $request, $invitationGroupId): JsonResponse
    {
        $invitationGroup = $this->invitationGroupRepository->getInvitationGroup($request->user(), $invitationGroupId);
        if (!$invitationGroup) {
            return preparedResponse('Invitation group not found', 404, true);
        }

        $this->invitationGroupRepository->removeInvitationGroup($request->user(), $invitationGroup);

        return preparedResponse([]);
    }

    /**
     * Start or retry processing invitations for an invitation group.
     */
    public function process(Request $request, $invitationGroupId): JsonResponse
    {
        $invitationGroup = $this->invitationGroupRepository->getInvitationGroup($request->user(), $invitationGroupId);
        if (!$invitationGroup) {
            return preparedResponse('Invitation group not found', 404, true);
        }

        if ($invitationGroup->status === InvitationGroup::STATUS_CANCELED) {
            return preparedResponse('This invitation group has been canceled and cannot be processed', 400, true);
        }

        if ($invitationGroup->status === InvitationGroup::STATUS_IN_PROGRESS) {
            return preparedResponse('This invitation group is already being processed', 400, true);
        }

        Invitation::where('user_id', $request->user()->id)
            ->where('invitation_group_id', $invitationGroup->id)
            ->where('status', Invitation::STATUS_FAILED)
            ->update([
                'status' => Invitation::STATUS_PENDING,
                'error' => null,
            ]);

        $invitationGroup->updateStats();

        $invitationGroup = $this->invitationGroupRepository->updateInvitationGroup($request->user(), $invitationGroup,
            ['status' => InvitationGroup::STATUS_IN_PROGRESS]);

        $invitationGroup = $invitationGroup->refresh();

        dispatch(new ProcessInvitationGroupJob($request->user(), $invitationGroup));

        return preparedResponse(['invitation_group' => $invitationGroup]);
    }

    /**
     * Cancel an invitation group that is in progress.
     */
    public function cancel(Request $request, $invitationGroupId): JsonResponse
    {
        $invitationGroup = $this->invitationGroupRepository->getInvitationGroup($request->user(), $invitationGroupId);

        if (!$invitationGroup) {
            return preparedResponse('Invitation group not found', 404, true);
        }

        if ($invitationGroup->status !== InvitationGroup::STATUS_IN_PROGRESS) {
            return preparedResponse('Only in-progress invitation groups can be canceled.', 400, true);
        }

        $invitationGroup = $this->invitationGroupRepository->updateInvitationGroup($request->user(), $invitationGroup, [
            'status' => InvitationGroup::STATUS_CANCELED,
        ]);

        return preparedResponse(['invitation_group' => $invitationGroup]);
    }

    public function export(Request $request, $invitationGroupId)
    {
        $invitationGroup = $this->invitationGroupRepository->getInvitationGroup($request->user(), $invitationGroupId);

        if (!$invitationGroup) {
            return preparedResponse('Invitation group not found', 404, true);
        }

        $files = $this->invitationGroupRepository->exportInvitationGroup($request->user(), $invitationGroup);

        return preparedResponse([
            'files' => $files,
        ]);
    }

    public function calculateGroupCost(Request $request, $invitationGroupId)
    {
        try {
            $shop = $request->user();
            $invitationGroup = $this->invitationGroupRepository->getInvitationGroup($shop, $invitationGroupId);

            if (!$invitationGroup) {
                return preparedResponse('Invitation group not found', 404, true);
            }

            $data = $this->invitationGroupRepository->calculateProcessCost($shop, $invitationGroup);

            return preparedResponse($data);
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return preparedResponse($e->getMessage(), 500, true);
        }
    }

    public function createSegmentAndInvite(Request $request)
    {
        try {
            $shop = $request->user();
            $invitationGroup = InvitationGroup::updateOrCreate([
                'user_id'          => $shop->id,
                'invite_all_group' => true,
            ], [
                'name'         => 'All disabled customer invite',
                'segment_id'   => null,
                'segment_name' => 'All disabled customers segment',
                'status'       => InvitationGroup::STATUS_IN_PROGRESS,
            ]);

            $this->prepareInvitations($shop, $invitationGroup);

            dispatch(new ProcessInvitationGroupJob($request->user(), $invitationGroup));

            return preparedResponse(['invitation_group' => $invitationGroup]);
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return preparedResponse($e->getMessage(), 500, true);
        }
    }

    public function prepareInvitations($shop, $invitationGroup)
    {
        $dbCustomers = Customer::where('user_id', $shop->id)
            ->where('state', Customer::STATE_DISABLED)
            ->get();
        $preparedInvitations = null;
        foreach ($dbCustomers as $dbCustomer) {
            $preparedInvitation = InvitationHelper::prepareInvitations($dbCustomer);
            $preparedInvitation['invitation_group_id'] = $invitationGroup->id;
            $preparedInvitation['status'] = Invitation::STATUS_PENDING;
            $preparedInvitation['created_at'] = now();
            $preparedInvitations[] = $preparedInvitation;
        }

        if ($preparedInvitations) {
            Invitation::insert($preparedInvitations);
        }
    }
}
