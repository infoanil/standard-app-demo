import React, {useEffect, useState} from 'react';
import {
    Text,
    Modal,
    SkeletonDisplayText,
    SkeletonBodyText,
    BlockStack,
    Banner,
    Link,
    InlineStack,
    List, Collapsible, DataTable
} from '@shopify/polaris';
import { API } from '../../api';
import {useNavigate} from "react-router-dom";

const ConfirmStart = ({
    openConfirmStartModal,
    setOpenConfirmStartModal,
    invitationGroup,
    setInvitationGroup,
    setLoader,
    setActions,
    from,
    recurringFetchInviteGroups
  }) => {

    const navigate = useNavigate();
    const [totalInvitees, setTotalInvitees] = useState(0);
    const [enabledCustomers, setEnabledCustomers] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [extraCustomer, setExtraCustomer] = useState(false);
    const [totalInvited, setTotalInvited] = useState(0);
    const [process, setProcess] = useState(false);
    const [open, setOpen] = useState(false);
    const [load, setLoad] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const startInviteProcess = async () => {
        if (extraCustomer) {
            return navigate('/plans');
        }
        if (showSuccessMessage) {
            return navigate('/invitation-groups');
        }
        try {
            setLoader(prev => ({ ...prev, startLoading: true }));
            setLoad(true);

            let url = `/app/invitation-groups/${invitationGroup.id}/process`;
            if (from === 'dashboard') {
                url = `/app/dashboard/invite-all`;
            }

            let { data } = await API.post(url, []);
            shopify.toast.show(data?.message || 'Invitations process initiated.');

            if (from !== 'dashboard') {
                setInvitationGroup(prevState => ({...prevState, ...data?.invitation_group}));
                setActions(prevState => ({...prevState, start: true}));
                recurringFetchInviteGroups();
                setOpenConfirmStartModal(false);
            }
            if (from === 'dashboard') {
                setShowSuccessMessage(true);
            }
        } catch (e) {
            console.error('Failed to initiate invitation group process', e);
            shopify.toast.show(e.response?.data?.message || 'Something went wrong. Please try again.', { isError: true });
        } finally {
            setLoader(prev => ({ ...prev, startLoading: false }));
            setLoad(false);
        }
    }

    const rows = [
        ['Free', 'Up to 5,000 invites', '—'],
        ['Pro', 'Up to 5,000 invites', '$0.001 per invite after 5,000'],
    ];
    const getInviteCost = async () => {
        try {
            setProcess(true);
            let url = `/app/invitation-groups/${invitationGroup.id}/invite-cost`;
            if (from === 'dashboard') {
                url = `/app/invite-cost`;
            }
            let { data } = await API.get(url);
            setTotalInvitees(parseInt(data.customers || '0'))
            setEnabledCustomers(data.enabledCustomers)
            setTotalCost(data.amount?.toFixed(2));
            setExtraCustomer(data.extraCustomer)
            setTotalInvited(parseInt(data.totalInvited))
        } catch (e) {
            console.error('Failed to get invite cost', e);
            shopify.toast.show(e.response?.data?.message || 'Something went wrong. Please try again.', { isError: true });
        } finally {
            setProcess(false);
        }
    }

    useEffect(() => {
        getInviteCost();
    }, []);

    const successProcessElement = (
        <Banner tone="success">
            <InlineStack gap="100" align="center" blockAlign="center">
                <p>The invitation process has been initiated. You can track the progress by clicking</p>
                <Link onClick={() => navigate('/invitation-groups')}>
                    here
                </Link>
            </InlineStack>
        </Banner>
    );

    const mainBlockElement = (
        <>
            <Text as="p" variant="bodyMd">Are you sure want to initiate invitations process for {from === 'dashboard' ? <strong>All disabled customers?</strong> : <strong>{invitationGroup?.name}?</strong>}</Text>
            <List type="bullet">
                <List.Item><Text as="p" variant="bodyMd"><strong>Total Invitees</strong>: {totalInvitees}</Text></List.Item>
                {extraCustomer ? <List.Item><Text as="p" variant="bodyMd"><strong>Extra Invitees</strong>: {extraCustomer} (Select plan to process these)</Text></List.Item> : ''}
                <List.Item><Text as="p" variant="bodyMd"><strong>Enabled Customers</strong>: {enabledCustomers}</Text></List.Item>
                <List.Item><Text as="p" variant="bodyMd"><strong>Total Cost</strong>: ${totalCost}</Text></List.Item>
            </List>
            <div>
                <InlineStack gap="100" blockAlign="center">
                    <p>Cost is calculated based on number of invites</p>
                    <Link onClick={() => setOpen((open) => !open)} ariaExpanded={open} ariaControls="basic-collapsible">
                        Pricing Tiers & Rates
                    </Link>
                </InlineStack>
                <Collapsible
                    open={open}
                    id="basic-collapsible"
                    transition={{duration: '500ms', timingFunction: 'ease-in-out'}}
                    expandOnPrint
                >
                    <BlockStack gap="300">
                        <DataTable
                            columnContentTypes={['text', 'text', 'text']}
                            headings={['Plan', 'Included free invites', 'Overage rate']}
                            rows={rows}
                        />
                    </BlockStack>
                </Collapsible>
            </div>
        </>
    );

    const extraCustomerWarning = (
        <Banner tone="warning">
            <InlineStack gap="100" align="center" blockAlign="center">
                <p>Please upgrade or choose a plan to invite all customers.</p>
                <Link onClick={() => navigate('/plans')}>
                    click here
                </Link>
            </InlineStack>
        </Banner>
    );

    const processLoader = (
        <BlockStack gap="300">
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText />
        </BlockStack>
    );


    return (
        <>
        <Modal
            id="invitation-create-start"
            sectioned
            open={openConfirmStartModal}
            onClose={() => setOpenConfirmStartModal(false)}
            title='Start bulk invites'
            primaryAction={{
                content: extraCustomer ? 'Select Plan' : (showSuccessMessage ? 'Track' : 'Start'),
                onAction: () => startInviteProcess(),
                loading: load
            }}
        >
            <Modal.Section>
                {process ? processLoader :
                    <BlockStack gap="300">
                        {showSuccessMessage ? successProcessElement : (
                            <>
                                {totalInvited ? <Banner><p>Overall, you've invited { totalInvited } customers so far - great work!</p></Banner>: ''}
                                {extraCustomer ? extraCustomerWarning : mainBlockElement}
                            </>
                        )}
                    </BlockStack>
                }
            </Modal.Section>
        </Modal>
    </>
    );
}

export default ConfirmStart;
