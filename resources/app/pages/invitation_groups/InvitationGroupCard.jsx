import {useNavigate} from "react-router-dom";
import {useAppBridge} from "@shopify/app-bridge-react";
import {useDispatch, useSelector} from "react-redux";
import {
    Badge,
    BlockStack,
    Button, ButtonGroup,
    Card,
    Divider,
    ExceptionList,
    InlineStack,
    ProgressBar,
    Text
} from "@shopify/polaris";
import {ChartVerticalFilledIcon, DeleteIcon, NoteIcon, CircleChevronDownIcon, ReplayIcon, SendIcon, XIcon} from "@shopify/polaris-icons";
import React, {useState} from "react";
import {invitationGroupStatuses} from "../../constants";
import {confirm} from "../../store/components/confirm";
import {API} from "../../api";
import ConfirmStart from "./ConfirmStart";
import './Style.css';
import usePlanUpgradePrompt from "../../components/PlanUpgradePrompt";

const InvitationGroupCard = (
    {
        invitationGroup,
        setInvitationGroup,
        setOpenCreateInvitationModal,
        actions,
        setActions,
        fromDetailsView,
        recurringFetchInviteGroups
    }) => {

    const navigate = useNavigate();
    const shopify = useAppBridge();
    const dispatch = useDispatch();

    const [loader, setLoader] = useState({
        cancelLoading: false,
        startLoading: false,
        updateLoading: false,
        deleteLoading: false,
        exportLoading: false,
    });

    const [openConfirmStartModal, setOpenConfirmStartModal] = useState(false);
    const shop = useSelector(state => state.shopStore?.shop);
    const planUpgradePrompt = usePlanUpgradePrompt();

    const handleCancelInvitationGroup = async () => {
        let { payload: confirmation } = await dispatch(confirm({
            title: 'Confirm',
            message: `Are you sure you want to terminate invitations process?`,
            tone: 'critical',
            options: {
                primaryAction: {
                    content: 'Terminate'
                }
            }
        }));

        if (!confirmation) {
            return;
        }
        try {
            setLoader(prev => ({ ...prev, cancelLoading: true }));

            let { data } = await API.post(`/app/invitation-groups/${invitationGroup.id}/cancel`, {});
            shopify.toast.show(data?.message || 'Invitation group process cancelled.');

            setInvitationGroup(prevState => ({...prevState, ...data?.invitation_group}));
            setActions(prevState => ({...prevState, cancel: true}));

        } catch (e) {
            console.error('Failed to cancel invitation group process', e);
            shopify.toast.show(e.response?.data?.message || 'Something went wrong. Please try again.', { isError: true });
        } finally {
            setLoader(prev => ({ ...prev, cancelLoading: false }));
        }
    }

    const handleStartInvitationGroup = async () => {
        let pendingCount = parseInt(invitationGroup.pending || '0')
        if (!shop?.plan && !shop?.development_store) {
            return planUpgradePrompt(shop?.plan);
        }

        setOpenConfirmStartModal(true);
    }

    const handleEditInvitationGroup = () => {
        setInvitationGroup(invitationGroup);
        setOpenCreateInvitationModal(true);
    }

    const handleDeleteInvitationGroup = async () => {
        let { payload: confirmation } = await dispatch(confirm({
            title: 'Confirm',
            message: `Are you sure you want to remove invitation group?`,
            tone: 'critical',
            options: {
                primaryAction: {
                    content: 'Remove'
                }
            }
        }));

        if (!confirmation) {
            return;
        }

        try {
            setLoader(prev => ({ ...prev, deleteLoading: true }));

            let { data } = await API.delete(`/app/invitation-groups/${invitationGroup.id}`);

            shopify.toast.show(data?.message || 'Invitation group deleted successfully.');
            setActions(prevState => ({...prevState, delete: true}));

            if (fromDetailsView) {
                navigate('/invitation-groups');
            }

        } catch (e) {
            console.error('Failed to delete invitation group', e);
            shopify.toast.show(e.response?.data?.message || 'Something went wrong. Please try again.', { isError: true });
        } finally {
            setLoader(prev => ({ ...prev, deleteLoading: false }));
        }
    }

    const handleExportInvitationGroup = async () => {
        try {
            setLoader(prev => ({ ...prev, exportLoading: true }));

            let { data } = await API.post(`/app/invitation-groups/${invitationGroup.id}/export`);

            shopify.toast.show(data?.message || 'Invitation group exported successfully.');

            data.files = data.files ? data.files : [];
            for (let fileIndex = 0; fileIndex < data.files.length; fileIndex++) {
                window.location.href = data.files[fileIndex];
                await new Promise((resolve, reject) => setTimeout(() => resolve(), 500))
            }

        } catch (e) {
            console.error('Failed to export invitation group', e);
            shopify.toast.show(e.response?.data?.message || 'Something went wrong. Please try again.', { isError: true });
        } finally {
            setLoader(prev => ({ ...prev, exportLoading: false }));
        }
    }

    const isDeletable = () => {
        if (invitationGroup.status === 'READY' && !invitationGroup.customer_fetched) return false

        return invitationGroup.status === 'READY' || invitationGroup.successful <= invitationGroup.charged
    }

    const rotatingSvg = (
        <span className="spinner-container">
            <svg
                className="spinner"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.3"
                />
                <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
            Syncing...
        </span>
    );

    const getInvitationGroupStatusComponent = (type = "badge") => {
        const { label, tone, progress, value:status } = invitationGroupStatuses.find(invitationGroupStatus => invitationGroupStatus.value === (invitationGroup.status === 'COMPLETED' && invitationGroup.failed ? 'PARTIALLY_COMPLETED' : invitationGroup.status));

        if (type === "badge") {
            if (invitationGroup.status === 'READY' && !invitationGroup.customer_fetched) {
                return <Badge size="small" tone="info">{rotatingSvg}</Badge>;
            } else {
                return <Badge size="small" progress={progress} tone={tone}>{label}</Badge>;
            }
        }

        if (type === "actions") {
            return <div style={{paddingTop:"5px"}}>
                <ButtonGroup>
                    {
                        status === 'READY' &&
                        <Button key="start" icon={SendIcon} variant="secondary" onClick={() => handleStartInvitationGroup()}
                                loading={loader.startLoading} disabled={invitationGroup.status === 'READY' && !invitationGroup.customer_fetched}>
                            Start
                        </Button>
                    }
                    {
                        status === 'IN_PROGRESS' &&
                        <Button key="cancel" icon={XIcon} variant="secondary" onClick={() => handleCancelInvitationGroup()} loading={loader.cancelLoading}>
                            Cancel
                        </Button>
                    }
                    {
                        (invitationGroup && invitationGroup.status === 'COMPLETED' && invitationGroup.total !== (invitationGroup.successful + invitationGroup.skipped)) &&
                        <Button key="retry" icon={ReplayIcon} variant="primary" onClick={() => handleStartInvitationGroup()} loading={loader.startLoading}>
                            Execute Failed Invitations
                        </Button>
                    }
                    {
                        fromDetailsView &&
                        <Button key="export" icon={CircleChevronDownIcon} variant="secondary" onClick={() => handleExportInvitationGroup()} loading={loader.exportLoading}>
                            Export
                        </Button>
                    }
                    {
                        !fromDetailsView &&
                        <Button key="view" icon={ChartVerticalFilledIcon} variant="secondary" onClick={() => navigate(`/invitation-groups/${invitationGroup.id}`)}>
                            View
                        </Button>
                    }
                    <Button key="edit" icon={ChartVerticalFilledIcon} variant="secondary" onClick={() => handleEditInvitationGroup()} loading={loader.updateLoading}>
                        Edit
                    </Button>
                    <Button key="delete" icon={DeleteIcon} tone="critical" onClick={() => handleDeleteInvitationGroup()}
                            loading={loader.deleteLoading} disabled={!isDeletable()}>
                        Delete
                    </Button>
                </ButtonGroup>
            </div>
        }

        return null;
    };

    return (
        <>
        <Card key={invitationGroup.id} roundedAbove="sm">
            <BlockStack gap="300">
                <InlineStack align="space-between">
                    <InlineStack gap="200" blockAlign="center">
                        <Text as="h2" variant="headingLg">{invitationGroup.name}</Text>
                        {getInvitationGroupStatusComponent("badge")}
                    </InlineStack>
                    <InlineStack align="end">
                        {getInvitationGroupStatusComponent("actions")}
                    </InlineStack>
                </InlineStack>

                <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="base" as="p">
                        Segment: <strong>{invitationGroup.segment_id ? invitationGroup.segment_name : 'Custom Selection (APP)'}</strong>
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                        #{invitationGroup.id + 1000} / {new Date(invitationGroup.created_at).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: shop?.timezone ? shop?.timezone : 'UTC'
                    })}
                    </Text>
                </InlineStack>

                <InlineStack align="space-between">
                    <BlockStack gap="100" align="center">
                        <Text as="p" variant="heading2xl">{invitationGroup.total}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">Total</Text>
                    </BlockStack>
                    <BlockStack gap="100" align="center">
                        <Text as="p" variant="heading2xl">{invitationGroup.status === 'READY' ? invitationGroup.pending + invitationGroup.skipped : invitationGroup.pending }</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">Pending</Text>
                    </BlockStack>
                    <BlockStack gap="100" align="center">
                        <Text as="p" variant="heading2xl">{invitationGroup.successful}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">Successful</Text>
                    </BlockStack>
                    <BlockStack gap="100" align="center">
                        <Text as="p" variant="heading2xl">{invitationGroup.status === 'READY' ? 0 : (invitationGroup.skipped || 0)}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">Skipped</Text>
                    </BlockStack>
                    <BlockStack gap="100" align="center">
                        <Text as="p" variant="heading2xl">{invitationGroup.failed}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">Failed</Text>
                    </BlockStack>
                </InlineStack>

                {
                    (invitationGroup && invitationGroup.progress)
                    ? <BlockStack gap="400">
                        <Divider borderColor="border"/>
                        <InlineStack align="space-between" blockAlign="center">
                            <BlockStack style={{width: "100%"}}>
                                <ProgressBar size="small" progress={invitationGroup.progress || 0} tone="success"/>
                            </BlockStack>
                            <BlockStack align="end">
                                <Text fontWeight="semibold" as="p" variant="bodyMd" tone="subdued">
                                    {parseFloat(invitationGroup.progress).toFixed(2)}%
                                </Text>
                            </BlockStack>
                            <ExceptionList
                                items={[
                                    {
                                        icon: NoteIcon,
                                        description: (invitationGroup.progress < 100 ? `Invitations are being processed (${parseFloat(invitationGroup.progress).toFixed(2)}%).` : 'Your invitation group has been processed.') + ` Click "View" button for more information.`,
                                    },
                                ]}
                            />
                        </InlineStack>
                    </BlockStack>
                    : <></>
                }
            </BlockStack>
        </Card>
        {openConfirmStartModal &&
            <ConfirmStart
                openConfirmStartModal={openConfirmStartModal}
                setOpenConfirmStartModal={setOpenConfirmStartModal}
                invitationGroup={invitationGroup}
                setInvitationGroup={setInvitationGroup}
                setLoader={setLoader}
                setActions={setActions}
                from="invitationGroup"
                shop={shop}
                recurringFetchInviteGroups={recurringFetchInviteGroups}
            />
        }
    </>
    );
}

export default InvitationGroupCard;
