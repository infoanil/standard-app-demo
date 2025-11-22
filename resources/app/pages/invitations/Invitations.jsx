import {
    Badge, BlockStack,
    Button, Card,
    ChoiceList, EmptyState, Icon,
    IndexFilters,
    IndexTable,
    Layout, Modal,
    SkeletonDisplayText,
    Text, TextContainer, TextField,
    useIndexResourceState, useSetIndexFiltersMode,
} from '@shopify/polaris';
import React, {useEffect, useState} from 'react';
import {EmailIcon, ViewIcon} from "@shopify/polaris-icons";
import {API} from "../../api";
import {useAppBridge} from "@shopify/app-bridge-react";
import {isEmptyValue} from "../../helpers";
import {useDispatch} from "react-redux";
import {customerStatuses, invitationStatuses} from "../../constants";

function Invitations({invitationGroupId}) {
    const shopify = useAppBridge();
    const dispatch = useDispatch();

    const [invitations, setInvitations] = useState([]);
    const [loader, setLoader] = useState({
        pageLoading: true,
        loading: false,
        inviteLoading: false,
        filtersLoading: false,
    });

    const [filtersApplied, setFiltersApplied] = useState(false);

    const [pagination, setPagination] = useState({
        page: 1,
        from: 1,
        last_page: 1,
        to: 1,
        total: 1,
        hasPrevious: false,
        hasNext: false,
    });

    const optionValueFields = {
        search: '',
        status: [],
    }

    const optionFields = {
        page: 1,
        per_page: 20,
        ...optionValueFields
    }

    const [options, setOptions] = useState({
        ...optionFields,
        sort_by: 'updated_at desc',
    });
    const [optionValues, setOptionValues] = useState({
        ...optionValueFields,
        sort_by: 'updated_at desc',
    });

    const tabs = [
        {
            content: 'All',
            index: 0,
            onAction: () =>  setOptionValues(prevState => ({
                ...prevState, status: []
            })),
            id: `All-0`,
            isLocked: true,
        },
        ...invitationStatuses.map((status, statusIndex) => ({
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
    const [openErrorModal, setOpenErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const sortOptions = [
        {label: 'Customer', value: 'customer_name asc', directionLabel: 'A-Z'},
        {label: 'Customer', value: 'customer_name desc', directionLabel: 'Z-A'},
        {label: 'Last Updated', value: 'updated_at asc', directionLabel: 'A-Z'},
        {label: 'Last Updated', value: 'updated_at desc', directionLabel: 'Z-A'},
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
        if (JSON.stringify(optionValues.status) !== JSON.stringify(status)) {
            setOptionValues(prevState => ({
                ...prevState,
                ...optionValueFields,
                status: status,
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

    const fetchInvitations = async () => {
        try {
            setLoader(prevState => ({
                ...prevState,
                filtersLoading: true,
                loading: true,
            }));

            let {data} = await API.get(`/app/invitation-groups/${invitationGroupId}/invitations`, {
                params: Object.fromEntries(
                    Object.entries(options).filter(([key, value]) => !isEmptyValue(value))
                ),
            });

            data = data.invitations || {};

            setInvitations(data.data || []);
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
            shopify.toast.show('Failed to load invitations', {isError: true});
        } finally {
            setLoader(prevState => ({
                ...prevState,
                filtersLoading: false,
                loading: false,
                pageLoading: false,
            }));
        }
    };

    const handleInvite = async (invitationId) => {
        try {
            setLoader(prevState => ({
                ...prevState,
                inviteLoading: invitationId,
            }));
            let { data } = await API.post(`/app/invitation-groups/${invitationGroupId}/invitations/${invitationId}/invite`, {
                invitation: invitationId
            });

            let invitationIndex = invitations.findIndex(invitation => invitation.id === invitationId);
            if (invitationIndex >= 0 && data.invitation) {
                invitations[invitationIndex] = data.invitation;
                setInvitations(prevState => ([...invitations]));
            }

            shopify.toast.show('Invitation sent successfully!');

        } catch (error) {
            shopify.toast.show('Failed to send invitation', {isError: true});
        } finally {
            setLoader(prevState => ({
                ...prevState,
                inviteLoading: false,
            }));
        }
    };

    const {mode, setMode} = useSetIndexFiltersMode();

    const filters = [
        {
            key: 'status',
            label: 'Status',
            filter: (
                <ChoiceList
                    title="Status"
                    titleHidden
                    choices={invitationStatuses.map(invitationStatus => {
                        return {
                            label: invitationStatus.label,
                            value: invitationStatus.value,
                        }
                    })}
                    selected={options.status || []}
                    onChange={(value) => setOptionValues(prevState => ({...prevState, status: value}))}
                    allowMultiple
                />
            ),
            pinned: true,
        },
    ];

    const appliedFilters = [];
    if (optionValues.status && optionValues.status.length) {
        appliedFilters.push({
            key: 'status',
            label: `Status: ${optionValues.status.join(', ')}`,
            onRemove: () => setOptionValues(prevState => ({...prevState, status: []})),
        });
    }

    const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(invitations);

    const rowMarkup = invitations.map(({ id, customer_id, customer_name, email, customer_state, status, error }, index) => (
        <IndexTable.Row
            id={id}
            key={id}
            selected={selectedResources.includes(id)}
            position={index}
        >
            <IndexTable.Cell>
                <Text variant="bodyMd" fontWeight="bold" as="span">{customer_id ? customer_id.split('/').pop() : 'N/A'}</Text>
            </IndexTable.Cell>
            <IndexTable.Cell>
                {customer_name || 'N/A'}
            </IndexTable.Cell>
            <IndexTable.Cell>
                {email || 'N/A'}
            </IndexTable.Cell>
            <IndexTable.Cell>
                {<Badge tone={customerStatuses.find(customerStatus => customerStatus.value === customer_state)?.tone || 'base'}>{customer_state}</Badge>}
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Badge tone={invitationStatuses.find(invitationStatus => invitationStatus.value === status)?.tone || 'base'}>{status}</Badge>
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Button title={error} variant="plain" disabled={!error} onClick={() => {
                    setErrorMessage(error || 'Something went wrong!');
                    setOpenErrorModal(true);
                }}>
                    <Icon source={ViewIcon} tone={"base"} />
                </Button>
            </IndexTable.Cell>
            <IndexTable.Cell>
                <Button
                    disabled={status === 'SENT' || customer_state === 'ENABLED'}
                    variant="plain"
                    icon={EmailIcon}
                    onClick={() => handleInvite(id)}
                    loading={id === loader.inviteLoading}
                >
                    {customer_state === 'INVITED' ? 'Re-Invite' : 'Invite'}
                </Button>
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

    const errorPopup = () => {
        let message = errorMessage ? JSON.parse(errorMessage) : [];
        message = message[0]?.message || 'Something went wrong!';
        return (
            <Modal
                open={openErrorModal}
                onClose={() => setOpenErrorModal(false)}
                title="Invitation Error"
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => setOpenErrorModal(false),
                    },
                ]}
            >
                <Modal.Section>
                    <Text as="p">{message}</Text>
                </Modal.Section>
            </Modal>
        )
    }

    const emptyState = () => {
        return (
            <Card>
                <EmptyState
                    heading="No Invitations Yet"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    fullWidth
                >
                    <p>
                        Please create new invitation group containing customers or try by syncing invitation group.
                    </p>
                </EmptyState>
            </Card>
        );
    }

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
        fetchInvitations();
    }, [options]);

    return (
        <Card padding="xs">
            {
                !filtersApplied && !loader.pageLoading && invitations.length === 0
                    ? emptyState()
                    : <>
                        <IndexFilters
                            sortOptions={sortOptions}
                            sortSelected={[optionValues.sort_by]}
                            onSort={(value) => setOptionValues(prevState => ({...prevState, sort_by: value[0]}))}
                            queryValue={optionValues.search}
                            queryPlaceholder="Search invitations"
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
                                selectable={false}
                                resourceName={{
                                    singular: 'invitation',
                                    plural: 'invitations',
                                }}
                                itemCount={invitations.length}
                                selectedItemsCount={
                                    allResourcesSelected ? 'All' : selectedResources.length
                                }
                                onSelectionChange={handleSelectionChange}
                                headings={[
                                    { title: 'Customer Id' },
                                    { title: 'Name' },
                                    { title: 'Email' },
                                    { title: 'Customer State' },
                                    { title: 'Status' },
                                    { title: 'Errors' },
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
            {errorPopup()}
        </Card>
    );
}

export default Invitations;
