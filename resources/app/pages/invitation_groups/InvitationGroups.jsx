import React, {useEffect, useState} from 'react';
import {
    Page,
    Card,
    BlockStack,
    Layout, SkeletonBodyText, EmptyState, ChoiceList, IndexFilters, useSetIndexFiltersMode, Text, Grid, Banner
} from '@shopify/polaris';
import { API } from '../../api';
import {isEmptyValue} from "../../helpers";
import InvitationGroupCreate from "./InvitationGroupCreate";
import {invitationGroupStatuses} from "../../constants";
import InvitationGroupCard from "./InvitationGroupCard";

const InvitationGroups = () => {
    const [invitationGroups, setInvitationGroups] = useState([]);
    const [loader, setLoader] = useState({
        pageLoading: true,
        loading: false,
        filtersLoading: false,
    });

    const actionFields = {
        create: false,
        update: false,
        start: false,
        cancel: false,
        delete: false,
        retry: false,
    };
    const [actions, setActions] = useState(actionFields);

    const [showProcessBanner, setShowProcessBanner] = useState(false);

    const [invitationGroup, setInvitationGroup] = useState(null);

    const [filtersApplied, setFiltersApplied] = useState(false);

    const [openCreateInvitationModal, setOpenCreateInvitationModal] = useState(false);

    const optionValueFields = {
        search: '',
        status: [],
    }

    const optionFields = {
        ...optionValueFields,
        all: true,
    }

    const [options, setOptions] = useState({
        ...optionFields,
    });
    const [optionValues, setOptionValues] = useState({
        ...optionValueFields,
    });

    const tabs = [
        {
            content: 'All',
            value: 'ALL',
            index: 0,
            onAction: () =>  setOptionValues(prevState => ({
                ...prevState, status: []
            })),
            id: `All-0`,
            isLocked: true,
        },
        ...invitationGroupStatuses.map((status, statusIndex) => ({
            content: status.label,
            value: status.value,
            index: statusIndex + 1,
            onAction: () =>  setOptionValues(prevState => ({
                ...prevState, status: [status.value]
            })),
            id: `${status.label}-${statusIndex + 1}`,
            isLocked: false,
        }))
    ];
    const [selectedTab, setSelectedTab] = useState(0);

    const {mode, setMode} = useSetIndexFiltersMode();

    const filters = [
        {
            key: 'status',
            label: 'Status',
            filter: (
                <ChoiceList
                    title="Status"
                    titleHidden
                    choices={invitationGroupStatuses.map(invitationGroupStatus => {
                        return {
                            label: invitationGroupStatus.label,
                            value: invitationGroupStatus.value,
                        }
                    })}
                    selected={optionValues.status || []}
                    onChange={(value) => setOptionValues(prev => ({...prev, status: value}))}
                    allowMultiple
                />
            ),
            pinned: true,
        }
    ];

    const appliedFilters = [];
    if (optionValues.status && optionValues.status.length) {
        appliedFilters.push({
            key: 'status',
            label: `Status: ${optionValues.status.join(', ')}`,
            //label: `Status: ${(optionValues.status.map(status => invitationGroupStatuses.find(invitationGroupStatus => invitationGroupStatus.value === status)?.label)).join(', ')}`,
            onRemove: () => setOptionValues(prevState => ({...prevState, status: []})),
        });
    }

    const showSkeleton = () => {
        return (
            <div style={{padding: '14px'}}>
                <Layout>
                    {[...Array(4)].map((_, index) => (
                        <Layout.Section key={index}>
                            <Card>
                                <SkeletonBodyText lines={8}/>
                            </Card>
                        </Layout.Section>
                    ))}
                </Layout>
            </div>
        );
    };

    const emptyState = (isEmptyState = true) => {
        return (
            <BlockStack gap="400">
                {showProcessBanner ?
                    <Banner tone="success"
                            title="Syncing customers... Bulk invite feature will be available once the sync is complete.."
                            onDismiss={() => setShowProcessBanner(false)}>
                    </Banner>: ''}
                <Card>
                    <EmptyState
                        heading={`${isEmptyState ? 'No Invitation Group Yet' : 'No invitation groups found'}`}
                        image={`${isEmptyState ? 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png' : 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'}`}
                        fullWidth
                    >
                        <p>
                            {isEmptyState ? 'Get started by creating a new invitation group. This allows you to manage and track your invitations efficiently.' : 'Try changing the filters or search term'}
                        </p>
                    </EmptyState>
                </Card>
            </BlockStack>
        );
    }

    const handleFiltersClearAll = () => {
        setOptionValues(prevState => ({
            ...prevState,
            ...optionValueFields,
        }));
        setSelectedTab(0);
    };

    const handleCancelFilters = () => {
        let status = (tabs[selectedTab] || {})?.value;
        status = status && status !== 'ALL' ? [status] : []
        console.log(optionValues.status, status);
        if (JSON.stringify(optionValues.status) !== JSON.stringify(status)) {
            setOptionValues(prevState => ({
                ...prevState,
                ...optionValueFields,
                status: status,
            }));
        }
    }

    const fetchInvitationGroups = async (isRecurring = false) => {
        let groupRes = null;
        try {
            if (!isRecurring) {
                setLoader(prevState => ({
                    ...prevState,
                    filtersLoading: true,
                    loading: true,
                }));
            }

            const {data} = await API.get('/app/invitation-groups', {
                params: Object.fromEntries(
                    Object.entries(options).filter(([key, value]) => !isEmptyValue(value))
                )
            });
            groupRes = data.invitation_groups;
            setInvitationGroups(groupRes);
        } catch (e) {
            shopify.toast.show('Failed to load invitation groups', {isError: true});
        } finally {
            if (!isRecurring) {
                setLoader(prevState => ({
                    ...prevState,
                    filtersLoading: false,
                    loading: false,
                    pageLoading: false,
                }));
            }
        }

        if (isRecurring) {
            return groupRes;
        }
    };

    const recurringFetchInviteGroups = async () => {
        const interval = setInterval( async () => {
            let data = await fetchInvitationGroups(true);
            if (data) {
                const shouldRetry = data.some(group => (group.status === 'READY' && !group.customer_fetched) || group.status === 'IN_PROGRESS');
                if (!shouldRetry) {
                    clearInterval(interval);
                }
            }
            else {
                clearInterval(interval);
            }
        }, 5000);
    }

    useEffect(() => {
        if (!openCreateInvitationModal) {
            setInvitationGroup(null);
        }
    }, [openCreateInvitationModal]);

    useEffect(() => {
        if (actions.delete || actions.create) {
            fetchInvitationGroups();
            recurringFetchInviteGroups();
            setActions(prevState => ({...prevState, delete: false, create: false}));
        }
        if (actions.update || actions.start || actions.retry || actions.cancel) {
            if (invitationGroup && invitationGroup.id) {
                let invitationGroupIndex = invitationGroups.findIndex(invitationGroupItem => invitationGroupItem.id === invitationGroup.id);
                if (invitationGroupIndex >= 0) {
                    invitationGroups[invitationGroupIndex] = invitationGroup;
                    setInvitationGroups(invitationGroups);
                }
            }
            setActions(prevState => ({...prevState, update: false, start: false, retry: false, cancel: false}));
        }
        setInvitationGroup(null);
    }, [actions]);

    useEffect(() => {
        if (loader.pageLoading) {
            return;
        }
        setFiltersApplied(true);
        const handler = setTimeout(() => {
            setOptions(prevState => ({
                ...prevState,
                ...optionValues
            }));
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [optionValues]);

    useEffect(() => {
        fetchInvitationGroups();
        recurringFetchInviteGroups();
    }, [options]);

    useEffect(() => {
        fetchBulkOperationStatus();
    }, [])

    const fetchBulkOperationStatus = async () => {
        try {
            let {data} = await API.get(`/app/customers/bulkOperation-status`);
            setShowProcessBanner(data?.bulkOperationInProgress || false);
            if (!data?.bulkOperationInProgress) return;
        } catch (e) {
            console.log(e)
        }

        const interval = setInterval( async () => {
            try {
                let {data} = await API.get(`/app/customers/bulkOperation-status`);
                if (data?.bulkOperationInProgress) {
                    setShowProcessBanner(true);
                } else {
                    setShowProcessBanner(false);
                    clearInterval(interval);
                }
            } catch (e) {
                clearInterval(interval);
            }
        }, 5000);
    }

    return (
        <Page
            fullWidth
            title="Invitation Groups"
            primaryAction={{
                content: 'Create Invitation Group',
                onAction: () => setOpenCreateInvitationModal(true),
                disabled: showProcessBanner
            }}
        >
            {
                !filtersApplied && !loader.pageLoading && invitationGroups.length === 0
                ? emptyState()
                : <BlockStack gap="400">
                    {showProcessBanner ?
                        <Banner tone="success"
                                title="Syncing customers... Bulk invite feature will be available once the sync is complete.."
                                onDismiss={() => setShowProcessBanner(false)}>
                        </Banner>: ''}
                    <Card padding="xs">
                        <IndexFilters
                            queryValue={optionValues.search}
                            queryPlaceholder="Search Invitation Group"
                            filters={filters}
                            appliedFilters={appliedFilters}
                            onQueryChange={(value) => setOptionValues(prevState => ({...prevState, search: value}))}
                            onQueryClear={() => setOptionValues(prevState => ({...prevState, search: ''}))}
                            onClearAll={handleFiltersClearAll}
                            loading={loader.filtersLoading}
                            tabs={tabs}
                            selected={selectedTab}
                            onSelect={setSelectedTab}
                            mode={mode}
                            setMode={setMode}
                            canCreateNewView={false}
                            cancelAction={{
                                onAction: () => handleCancelFilters(),
                            }}
                        />
                    </Card>

                    {
                        loader.loading
                        ? showSkeleton()
                        : (
                            !invitationGroups.length ? emptyState(false) : <>
                                {invitationGroups.map((invitationGroupItem) => {
                                    return (
                                        <InvitationGroupCard
                                            key={invitationGroupItem.id}
                                            invitationGroup={invitationGroupItem}
                                            setInvitationGroup={setInvitationGroup}
                                            actions={actions}
                                            setActions={setActions}
                                            setOpenCreateInvitationModal={setOpenCreateInvitationModal}
                                            fromDetailsView={false}
                                            recurringFetchInviteGroups={recurringFetchInviteGroups}
                                        />
                                    );
                                })}
                            </>
                        )
                    }
                </BlockStack>
            }

            {openCreateInvitationModal &&
                <InvitationGroupCreate
                    openCreateInvitationModal={openCreateInvitationModal}
                    setOpenCreateInvitationModal={setOpenCreateInvitationModal}
                    invitationGroup={invitationGroup}
                    setInvitationGroup={setInvitationGroup}
                    actions={actions}
                    setActions={setActions}
                />
            }

            <div style={{TextAlign: "center",padding: "20px"}}>
                <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                    <div style={{TextAlign: "center", paddingBottom: "12px"}}>
                        <Text as="p" alignment="center">Build with ❤️ by UpSolite, ©2025.</Text>
                    </div>
                </Grid.Cell>
            </div>
        </Page>
    );
};

export default InvitationGroups;
