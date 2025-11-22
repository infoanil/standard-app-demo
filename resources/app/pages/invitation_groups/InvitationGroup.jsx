import React, { useEffect, useState } from 'react';
import {
    Page,
    Card,
    BlockStack,
    Divider,
    SkeletonBodyText,
    SkeletonDisplayText,
} from '@shopify/polaris';
import {useNavigate, useParams} from 'react-router-dom';
import { API } from '../../api';
import InvitationGroupCard from "./InvitationGroupCard";
import InvitationGroupCreate from "./InvitationGroupCreate";
import Invitations from "../invitations/Invitations";

const InvitationGroup = () => {

    const navigate = useNavigate();
    const { invitationGroupId } = useParams();

    const [loader, setLoader] = useState({
        pageLoading: true,
        loading: false,
    });

    const [openCreateInvitationModal, setOpenCreateInvitationModal] = useState(false);
    const actionFields = {
        create: false,
        update: false,
        start: false,
        cancel: false,
        delete: false,
        retry: false,
    };
    const [actions, setActions] = useState(actionFields);

    const [invitationGroup, setInvitationGroup] = useState(null);

    const showSkeleton = () => (
        <div style={{ padding: '14px' }}>
            <BlockStack gap="1000">
                <SkeletonDisplayText size="small" />
                <Card>
                    <Divider />
                    <BlockStack gap="800">
                        <SkeletonBodyText lines={6} />
                        <SkeletonBodyText lines={6} />
                        <SkeletonBodyText lines={6} />
                    </BlockStack>
                </Card>
            </BlockStack>
        </div>
    );

    const fetchInvitationGroupDetails = async (isRecurring = false) => {
        if (!invitationGroupId) return;
        let data = null;
        try {
            if (!isRecurring) {
                setLoader(prevState => ({...prevState, loading: true}));
            }

            const response = await API.get(`/app/invitation-groups/${invitationGroupId}`);
            data = response.data;
            setInvitationGroup(data?.invitation_group);

        } catch (e) {
            shopify.toast.show(e.response?.data?.message || 'Enable to fetch invitation group', {isError: true});

            if (e.status === 404) {
                navigate('/invitation-groups');
            }
        } finally {
            setLoader(prevState => ({...prevState, pageLoading: false, loading: false}));
        }

        if (isRecurring) {
            return data?.invitation_group;
        }
    };

    useEffect(() => {
        if (!invitationGroupId) return;

        fetchInvitationGroupDetails();

        const interval = setInterval( async () => {
            let data = await fetchInvitationGroupDetails(true);
            if (data) {
                setInvitationGroup(prevState => {
                    if (!['IN_PROGRESS'].includes(data.status)) {
                        clearInterval(interval);
                    }
                    return prevState;
                });
            }
            else {
                clearInterval(interval);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Page
            fullWidth
            title="Invitation Group Details"
            backAction={{
                onAction: () => navigate('/invitation-groups')
            }}
        >
            {
                loader.loading
                    ? showSkeleton()
                    : <BlockStack gap="400">
                        {
                            invitationGroup && invitationGroup.id &&
                            <>
                                <InvitationGroupCard
                                    key={invitationGroupId}
                                    invitationGroup={invitationGroup}
                                    setInvitationGroup={setInvitationGroup}
                                    actions={actions}
                                    setActions={setActions}
                                    setOpenCreateInvitationModal={setOpenCreateInvitationModal}
                                    fromDetailsView={true}
                                />
                                <Invitations invitationGroupId={invitationGroup.id} />
                            </>
                        }
                    </BlockStack>
            }

            {(openCreateInvitationModal && invitationGroup && invitationGroup.id)
                ?
                <InvitationGroupCreate
                    openCreateInvitationModal={openCreateInvitationModal}
                    setOpenCreateInvitationModal={setOpenCreateInvitationModal}
                    invitationGroup={invitationGroup}
                    setInvitationGroup={setInvitationGroup}
                    actions={actions}
                    setActions={setActions}
                />
                : <></>
            }
        </Page>
    );
};

export default InvitationGroup;
