import {
    Badge, Banner,
    Button, ButtonGroup, Card,
    ChoiceList, EmptyState, Grid,
    IndexFilters,
    IndexTable,
    Layout, OptionList,
    Page, Popover, SkeletonDisplayText,
    Text, TextField, Tooltip,
    useIndexResourceState, useSetIndexFiltersMode,
} from '@shopify/polaris';
import React, {useEffect, useState} from 'react';
import {MenuVerticalIcon} from "@shopify/polaris-icons";
import {API} from "../../api";
import {useNavigate} from "react-router-dom";
import {useAppBridge} from "@shopify/app-bridge-react";
import {isEligible, isEmptyValue} from "../../helpers";
import {confirm} from "../../store/components/confirm";
import {useDispatch, useSelector} from "react-redux";
import {customerStatuses, FEATURES} from "../../constants";
import usePlanUpgradePrompt from "../../components/PlanUpgradePrompt";

function Customers() {
    const navigate = useNavigate();
    const shopify = useAppBridge();
    const dispatch = useDispatch();
    const planUpgradePrompt = usePlanUpgradePrompt();
    const shop = useSelector(state => state.shopStore?.shop);

    const [customers, setCustomers] = useState([]);
    const [loader, setLoader] = useState({
        pageLoading: true,
        loading: false,
        bulkInviteLoading: false,
        filtersLoading: false,
        inviteLoading: false,
        createInvitationLink: false,
        createLoginLink: false,
        syncLoading: false,
    });

    const [filtersApplied, setFiltersApplied] = useState(false);
    const [showProcessBanner, setShowProcessBanner] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        from: 1,
        last_page: 1,
        to: 1,
        total: 1,
        hasPrevious: false,
        hasNext: false,
    });
    const [selected, setSelected] = useState('');
    const [activePopoverId, setActivePopoverId] = useState(null);

    const actionOptions = (state) => {
        return [
            {
                value: 'send-invitation',
                label: state === 'INVITED' ? 'Resend Invitation' : 'Send Invitation',
            },
            {
                value: 'invitation-link',
                label: 'Generate Invitation Link',
            },
            ...(
                shop?.shopify_plus || shop?.development_store
                    ? [{
                        value: 'login-link',
                        label: 'Generate Login Link',
                    }]
                    : []
            )
        ]
    };

    const selectAction = (type, id, state) => {
        if (!shop?.plan && !shop?.development_store) {
            return planUpgradePrompt(shop?.plan);
        }
        setSelected(type)
        setActivePopoverId(null);

        let action = type && type.length ? type[0] : '';

        if (action === 'send-invitation') {
            if (state === 'ENABLED') {
                shopify.toast.show('Customer is already activated!', {isError: true});
            } else {
                handleInvite(id);
            }
        } else if (action === 'invitation-link') {
            if (state === 'ENABLED') {
                shopify.toast.show('Customer is already activated!', {isError: true});
            } else {
                handleCreateInvitationLink(id);
            }
        } else if (action === 'login-link') {
            handleCreateLoginLink(id);
        }
    }

    const optionValueFields = {
        search: '',
        state: [],
        tag: '',
    }

    const optionFields = {
        page: 1,
        per_page: 20,
        ...optionValueFields
    }

    const [options, setOptions] = useState({
        ...optionFields,
        sort_by: 'source_created_at desc',
    });
    const [optionValues, setOptionValues] = useState({
        ...optionValueFields,
        sort_by: 'source_created_at desc',
    });

    const tabs = [
        {
            content: 'All',
            index: 0,
            onAction: () =>  setOptionValues(prevState => ({
                ...prevState, state: []
            })),
            id: `All-0`,
            isLocked: true,
        },
        ...customerStatuses.map((status, statusIndex) => ({
            content: status.label,
            index: statusIndex + 1,
            onAction: () =>  setOptionValues(prevState => ({
                ...prevState, state: [status.value]
            })),
            id: `${status.label}-${statusIndex + 1}`,
            isLocked: false,
        }))
    ];
    const [selectedTab, setSelectedTab] = useState(0);

    const promotedBulkActions = [
        {
            content: 'Send Invites',
            onAction: () => handleBulkInvite(),
            disabled: loader.bulkInviteLoading
        },
    ];

    const sortOptions = [
        {label: 'Customer', value: 'first_name asc', directionLabel: 'A-Z'},
        {label: 'Customer', value: 'first_name desc', directionLabel: 'Z-A'},
        {label: 'Date', value: 'source_created_at asc', directionLabel: 'A-Z'},
        {label: 'Date', value: 'source_created_at desc', directionLabel: 'Z-A'},
    ];

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
        if (JSON.stringify(optionValues.state) !== JSON.stringify(status)) {
            setOptionValues(prevState => ({
                ...prevState,
                ...optionValueFields,
                state: status,
            }));
        }
    }

    const handlePreviousPage = () => {
        if (!pagination.hasPrevious) {
            return;
        }

        let previousPage = options.page - 1;
        if (previousPage <= 0) previousPage = 1;

        setOptions(prevState => ({
            ...prevState,
            page: previousPage
        }));
    };

    const handleNextPage = async () => {
        if (!pagination.hasNext) {
            return;
        }
        setOptions(prevState => ({
            ...prevState,
            page: options.page + 1
        }));
    };

    const handleSyncCustomers = async () => {
        try {
            setLoader(prevState => ({
               ...prevState,
                syncLoading: true,
            }));

            let { data } = await API.post(`/app/customers/sync`, {});

            shopify.toast?.show('Customer sync has begun. Please wait until it finishes.');
            setShowProcessBanner(true);
            setIsSyncing(true);
            await fetchBulkOperationStatus()
        } catch (e) {
            shopify.toast.show(e.response?.data?.message || 'Failed to sync customers', {isError: true});
        } finally {
            setLoader(prevState => ({
               ...prevState,
                syncLoading: false,
            }));
        }
    }

    const fetchCustomers = async () => {
        try {
            setLoader(prevState => ({
                ...prevState,
                filtersLoading: true,
                loading: true,
            }));

            let {data} = await API.get(`/app/customers`, {
                params: Object.fromEntries(
                    Object.entries(options).filter(([key, value]) => !isEmptyValue(value))
                ),
            });

            data = data.customers || [];

            setCustomers(data?.data || []);
            setPagination({
                ...pagination,
                page: data.current_page,
                from: data.from,
                last_page: data.last_page,
                to: data.to,
                total: data.total,
                hasPrevious: !!(data?.prev_page_url),
                hasNext: !!(data?.next_page_url),
            });
        } catch (e) {
            shopify.toast.show('Failed to load customers', {isError: true});
        } finally {
            setLoader(prevState => ({
                ...prevState,
                filtersLoading: false,
                loading: false,
                pageLoading: false,
            }));
        }
    };

    const fetchBulkOperationStatus = async () => {
        try {
            let {data} = await API.get(`/app/customers/bulkOperation-status`);
            setShowProcessBanner(data?.bulkOperationInProgress || false);
            setIsSyncing(data?.bulkOperationInProgress || false);
            if (!data?.bulkOperationInProgress) return;
        } catch (e) {
            console.log(e)
        }

        const interval = setInterval( async () => {
            try {
                let {data} = await API.get(`/app/customers/bulkOperation-status`);

                if (data?.bulkOperationInProgress) {
                    setShowProcessBanner(true);
                    setIsSyncing(true);
                } else {
                    await fetchCustomers();
                    setShowProcessBanner(false);
                    setIsSyncing(false);
                    clearInterval(interval);
                }
            } catch (e) {
                clearInterval(interval);
            }
        }, 5000);
    }

    const handleInvite = async (customerId) => {
        try {
            setLoader(prevState => ({
                ...prevState,
                inviteLoading: customerId,
            }));
            let { data } = await API.post(`/app/customers/${customerId}/invite`, {});

            let customerIndex = customers.findIndex(customer => customer.id === customerId);
            if (customerIndex >= 0 && data.customer) {
                customers[customerIndex] = data.customer;
                setCustomers(prevState => ([...customers]));
            }

            shopify.toast.show('Invitation sent successfully');
        } catch (e) {
            shopify.toast.show('Failed to send invitation', {isError: true});
        } finally {
            setLoader(prevState => ({
                ...prevState,
                inviteLoading: false,
            }));
        }
    };

    const handleCreateInvitationLink = async (customerId) => {
        try {
            setLoader(prevState => ({
                ...prevState,
                createInvitationLink: customerId,
            }));
            let { data } = await API.post(`/app/customers/${customerId}/create-invitation-url`, {});

            await navigator.clipboard.writeText(data.invitation_url);

            shopify.toast.show('Invitation link copied');
        } catch (e) {
            shopify.toast.show('Failed to create invitation link', {isError: true});
        } finally {
            setLoader(prevState => ({
                ...prevState,
                createInvitationLink: false,
            }));
        }
    };

    const handleCreateLoginLink = async (customerId) => {
        if (!isEligible(shop, FEATURES.MULTIPASS_LOGIN)) {
            return planUpgradePrompt(shop?.plan);
        }
        try {
            setLoader(prevState => ({
                ...prevState,
                createLoginLink: customerId,
            }));
            let { data } = await API.post(`/app/customers/${customerId}/create-login-url`, {});
            if (!data.url) {
                shopify.toast.show(data.message ? data.message : 'Failed to create login link', {isError: true});
                return;
            }

            await navigator.clipboard.writeText(data.url);
            shopify.toast.show('Customer Login link copied');
        } catch (e) {
            shopify.toast.show('Failed to create login link', {isError: true});
        } finally {
            setLoader(prevState => ({
                ...prevState,
                createLoginLink: false,
            }));
        }
    };

    const handleBulkInvite = async () => {

        if (!isEligible(shop, FEATURES.BULK_INVITES)) {
            return planUpgradePrompt(shop?.plan);
        }
        let { payload: confirmation } = await dispatch(confirm({
            title: 'Confirm',
            message: `Are you sure you want to send invitations to ${selectedResources.length} selected customers?`,
            options: {
                primaryAction: {
                    content: 'Send Invites'
                }
            }
        }));

        if (!confirmation) {
            return;
        }

        setLoader(prevState => ({
            ...prevState,
            bulkInviteLoading: true,
            filtersLoading: true,
        }));

        try {
            const {data} = await API.post('/app/customers/bulk-invite', { customers: selectedResources });
            shopify.toast.show('Invitations are being sent');

            if (data?.invitation_group?.id) {
                navigate(`/invitation-groups/${data.invitation_group.id}`);
            }

        } catch (e) {
            console.error('Error sending invite:', e);
            shopify.toast.show('Failed to send invitations', {isError: true});
        } finally {
            setLoader(prevState => ({
                ...prevState,
                bulkInviteLoading: false,
                filtersLoading: false,
            }));
        }
    };

    const togglePopoverActive = (e, rowId) => {
        e.stopPropagation();
        setActivePopoverId((prevId) => (prevId === rowId ? null : rowId));
    }


    const {mode, setMode} = useSetIndexFiltersMode();

    const filters = [
        {
            key: 'state',
            label: 'Status',
            filter: (
                <ChoiceList
                    title="Status"
                    titleHidden
                    choices={customerStatuses.map(customerStatus => {
                        return {
                            label: customerStatus.label,
                            value: customerStatus.value,
                        }
                    })}
                    selected={options.state || []}
                    onChange={(value) => setOptionValues(prevState => ({...prevState, state: value}))}
                    allowMultiple
                />
            ),
            shortcut: true,
        },
        {
            key: 'taggedWith',
            label: 'Tagged with',
            filter: (
                <TextField
                    label="Tagged with"
                    value={optionValues.tag}
                    onChange={(value) => setOptionValues(prevState => ({...prevState, tag: value}))}
                    autoComplete="off"
                    labelHidden
                    clearButton
                    onClearButtonClick={() => setOptionValues(prevState => ({...prevState, tag: ''}))}
                />
            ),
            shortcut: true,
        }
    ];

    const appliedFilters = [];
    if (optionValues.state && optionValues.state.length) {
        appliedFilters.push({
            key: 'state',
            label: `Status: ${optionValues.state.join(', ')}`,
            onRemove: () => setOptionValues(prevState => ({...prevState, state: []})),
        });
    }
    if (optionValues.tag) {
        appliedFilters.push({
            key: 'taggedWith',
            label: `Tagged with ${optionValues.tag}`,
            onRemove: () => setOptionValues(prevState => ({...prevState, tag: ''})),
        });
    }

    const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(customers);

    const rowMarkup = customers.map(({ id, graphql_id, first_name, last_name, email, state, created_at }, index) => (
        <IndexTable.Row
            id={id}
            key={id}
            selected={selectedResources.includes(id)}
            position={index}
        >
            <IndexTable.Cell>
                <Text variant="bodyMd" fontWeight="bold" as="span">{(`${first_name ? first_name : ''} ${last_name ? last_name : ''}`).trim() || 'N/A'}</Text>
            </IndexTable.Cell>
            <IndexTable.Cell>
                {email || 'N/A'}
            </IndexTable.Cell>
            <IndexTable.Cell>
                {<Badge tone={customerStatuses.find(customerStatus => customerStatus.value === state)?.tone || 'base'}>{state}</Badge>}
            </IndexTable.Cell>
            <IndexTable.Cell>
                {new Date(created_at).toLocaleString('en-US')}
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Popover
                    active={activePopoverId === id}
                    activator={
                        <Button icon={MenuVerticalIcon} onClick={(e) => togglePopoverActive(e, id)}></Button>
                    }
                    autofocusTarget="first-node"
                    onClose={() => setActivePopoverId(null)}
                >
                    <div
                        onClick={(e) => {
                            e?.stopPropagation();
                        }}
                    >
                        <OptionList
                            onChange={(a) => selectAction(a, id, state)}
                            options={actionOptions(state)}
                            selected={[selected]}
                            allowMultiple={false}
                        />
                    </div>

                </Popover>
            </IndexTable.Cell>
        </IndexTable.Row>
    ));

    const showSkeleton = () => {
        return (
            <div style={{ padding: '14px' }}>
                <Layout>
                    {[...Array(16)].map((_, index) => (
                        <Layout.Section key={index}>
                            <SkeletonDisplayText maxWidth="100%" size="small" />
                        </Layout.Section>
                    ))}
                </Layout>
            </div>
        );
    }

    const emptyState = () => {
        return (
            <Card>
                <EmptyState
                    heading="No Customers Yet"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    fullWidth
                >
                    <p>
                        Get started by syncing the customers.
                    </p>
                </EmptyState>
            </Card>
        );
    }

    useEffect(() => {
        let maxAllowed = 20;
        if (selectedResources && selectedResources.length > maxAllowed) {
            setLoader(prevState => ({...prevState, bulkInviteLoading: true}))
            shopify.toast.show(`You can send up to ${maxAllowed} invitations here. To send more, please create an Invitation Group.`, {isError: true});
        } else {
            setLoader(prevState => ({...prevState, bulkInviteLoading: false}))
        }
    }, [selectedResources]);

    useEffect(() => {
        if (loader.pageLoading) {
            return;
        }
        setFiltersApplied(true);
        const handler = setTimeout(() => {
            setOptions(prevState => ({
                ...prevState,
                page: 1,
                ...optionValues
            }));
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [optionValues]);

    useEffect(() => {
        fetchCustomers();
    }, [options]);

    useEffect( () => {
        fetchBulkOperationStatus();
    }, []);

    return (
        <Page
            fullWidth
            title="Customers"
            primaryAction={{
                content: 'Sync Customers',
                onAction: () => handleSyncCustomers(),
                loading: loader.syncLoading,
                disabled: isSyncing
            }}
        >
            <>
            {showProcessBanner ?
                <div style={{marginBottom: '20px'}}>

                        <Banner tone="success"
                                title="Syncing customers... Please wait while we fetch data from Shopify."
                                onDismiss={() => setShowProcessBanner(false)}>
                        </Banner>

                </div> : ''}
                <Card padding="xs">
                    {
                        !filtersApplied && !loader.pageLoading && customers.length === 0
                            ? emptyState()
                            : <>
                                <IndexFilters
                                    sortOptions={sortOptions}
                                    sortSelected={[optionValues.sort_by]}
                                    onSort={(value) => setOptionValues(prevState => ({...prevState, sort_by: value[0]}))}
                                    queryValue={optionValues.search}
                                    queryPlaceholder="Search customers"
                                    onQueryChange={(value) => setOptionValues(prevState => ({...prevState, search: value}))}
                                    onQueryClear={() => setOptionValues(prevState => ({...prevState, search: ''}))}
                                    onClearAll={handleFiltersClearAll}
                                    loading={loader.filtersLoading}
                                    tabs={tabs}
                                    selected={selectedTab}
                                    onSelect={setSelectedTab}
                                    filters={filters}
                                    appliedFilters={appliedFilters}
                                    mode={mode}
                                    setMode={setMode}
                                    canCreateNewView={false}
                                    cancelAction={{
                                        onAction: () => handleCancelFilters(),
                                    }}
                                />
                                {
                                    loader.loading ? (
                                        showSkeleton()
                                    ) : <IndexTable
                                        resourceName={{
                                            singular: 'customer',
                                            plural: 'customers',
                                        }}
                                        itemCount={customers.length}
                                        selectedItemsCount={
                                            allResourcesSelected ? 'All' : selectedResources.length
                                        }
                                        onSelectionChange={handleSelectionChange}
                                        promotedBulkActions={promotedBulkActions}
                                        selectable={false}
                                        headings={[
                                            { title: 'Customer Name' },
                                            { title: 'Email' },
                                            { title: 'Status' },
                                            { title: 'Created At' },
                                            { title: 'Actions' },
                                        ]}
                                        pagination={{
                                            hasPrevious: pagination.hasPrevious,
                                            onPrevious: handlePreviousPage,
                                            hasNext: pagination.hasNext,
                                            onNext: handleNextPage,
                                            label: pagination.total ? `Showing ${pagination.from} to ${pagination.to} of ${pagination.total}` : '',
                                        }}
                                    >
                                        {rowMarkup}
                                    </IndexTable>
                                }
                            </>
                    }
                </Card>
                <div style={{TextAlign: "center",padding: "10px"}}>
                    <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                        <div style={{TextAlign: "center", paddingBottom: "12px"}}>
                            <Text as="p" alignment="center">Build with ❤️ by UpSolite, ©2025.</Text>
                        </div>
                    </Grid.Cell>
                </div>
            </>
        </Page>
    );
}

export default Customers;
