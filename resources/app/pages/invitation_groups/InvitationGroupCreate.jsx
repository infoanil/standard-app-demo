import React, {useCallback, useEffect, useState} from 'react';
import {
    Button,
    BlockStack,
    Text,
    Banner,
    Link,
    InlineStack, Autocomplete, Icon, TextField, InlineError,
    Modal
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { API } from '../../api';
import {SearchIcon} from "@shopify/polaris-icons";
import {TitleBar, useAppBridge} from "@shopify/app-bridge-react";

const InvitationGroupCreate = (
    {
        openCreateInvitationModal,
        setOpenCreateInvitationModal,
        invitationGroup,
        setInvitationGroup,
        actions,
        setActions,
    }) => {

    const shopify = useAppBridge();

    const [editMode, setEditMode] = useState(false);
    const [loader, setLoader] = useState({
        segmentLoading: true,
        fetchSegmentLoading: false,
        createLoading: false,
    });
    const [form, setForm] = useState({
        name: '',
        segment: {
            id: '',
            name: '',
            customers: null,
        },
    });
    const [formErrors, setFormErrors] = useState({
        name: '',
        segment: '',
    });
    const [clonedSegments, setClonedSegments] = useState([]);
    const [segments, setSegments] = useState([]);
    const [selectedSegments, setSelectedSegments] = useState([]);
    const [searchSegment, setSearchSegment] = useState('');

    const navigate = useNavigate();

    const handleFetchCustomers = async () => {
        if (!(form.segment && form.segment.id)) {
            return;
        }

        setLoader(prevState => ({...prevState, fetchSegmentLoading: true}));
        setFormErrors(prevState => ({
            ...prevState,
            segment: '',
        }));

        try {
            const { data } = await API.get(`/app/customers/segment`, {
                params: { segment: form.segment.id },
            });

            setForm(prevState => ({
                ...prevState,
                segment: {
                    ...prevState.segment,
                    customers: data.customers ? data.customers : 0,
                },
            }));
        } catch (e) {
            console.error(e);
            shopify.toast.show(e?.response?.data?.message || 'Failed to fetch customers. Please try again.', {isError: true});
        } finally {
            setLoader(prevState => ({...prevState, fetchSegmentLoading: false}));
        }
    };

    const handleCreateInvitationGroup = async () => {

        if (!form.name) {
            setFormErrors(prevState => ({
                ...prevState,
                segment: 'Name field is required.'
            }));
            return;
        }
        if (!(form.segment && form.segment.id)) {
            setFormErrors(prevState => ({
                ...prevState,
                segment: 'Segment field is required'
            }));
            return;
        }
        if (!(form.segment && form.segment.customers)) {
            setFormErrors(prevState => ({
                ...prevState,
                segment: 'Segment should have at least one customer'
            }));
            return;
        }

        setLoader(prevState => ({...prevState, createLoading: true}));

        try {
            const {data} = await API.post('/app/invitation-groups', {
                name: form.name,
                segment: {
                    id: form.segment.id,
                    name: form.segment.name
                }
            });

            shopify.toast.show('Invitation group created successfully');

            setOpenCreateInvitationModal(false);
            setActions(prevState => ({...prevState, create: true}));

            navigate(`/invitation-groups`);
        } catch (e) {
            console.error(e);
            shopify.toast.show('Failed to create invitation group. Please try again.', { isError: true });
        } finally {
            setLoader(prevState => ({...prevState, createLoading: false}));
        }
    };

    const handleUpdateInvitationGroup = async () => {

        if (!editMode) {
            return;
        }

        if (!form.name) {
            setFormErrors(prevState => ({
                ...prevState,
                name: 'Name field is required.'
            }));
            return;
        }

        setLoader(prevState => ({...prevState, createLoading: true}));

        try {
            const {data} = await API.put(`/app/invitation-groups/${invitationGroup.id}`, {
                name: form.name,
            });

            shopify.toast.show('Invitation group updated successfully');
            setInvitationGroup(prevState => ({...prevState, ...data?.invitation_group}));
            setOpenCreateInvitationModal(false);

            setActions(prevState => ({...prevState, update: true}));

        } catch (e) {
            console.error(e);
            shopify.toast.show('Failed to update invitation group. Please try again.', { isError: true });
        } finally {
            setLoader(prevState => ({...prevState, createLoading: false}));
        }
    };

    const fetchSegments = async () => {
        setLoader(prevState => ({...prevState, segmentLoading: true}));

        try {
            const {data} = await API.get('/app/segments');

            setSegments((data?.segments || []).map(segmentData => {
                return {label: segmentData.name, value: segmentData.id}
            }));

            setClonedSegments((data?.segments || []).map(segmentData => {
                return {label: segmentData.name, value: segmentData.id}
            }));
        } catch (e) {
            console.error('Failed to load segments', e);
        } finally {
            setLoader(prevState => ({...prevState, segmentLoading: false}));
        }
    }

    const handleSegmentSearch = useCallback((value) => {
        setSearchSegment(value);
        setForm(prevState => ({
            ...prevState,
            segment: {},
        }));
        setLoader(prevState => ({...prevState, segmentLoading: true}));

        setTimeout(() => {
            if (value === '') {
                setSegments(JSON.parse(JSON.stringify(clonedSegments)));
                setLoader(prevState => ({...prevState, segmentLoading: false}));
                setFormErrors(prevState => ({
                    ...prevState,
                    segment: 'Segment field is required'
                }));
                return;
            }
            const filterRegex = new RegExp(value, 'i');
            const resultOptions = JSON.parse(JSON.stringify(clonedSegments)).filter((segmentData) =>
                segmentData.label.match(filterRegex),
            );
            setSegments(resultOptions);
            setLoader(prevState => ({...prevState, segmentLoading: false}));
        }, 300);
    }, [clonedSegments, loader.segmentLoading]);

    const handleSegmentSelection = useCallback(
        (selected) => {
            setFormErrors(prevState => ({
                ...prevState,
                segment: ''
            }));

            const selectedSegment = selected.map((selectedItem) => {
                return segments.find((segmentData) => {
                    return segmentData.value.match(selectedItem);
                });
            });
            setSelectedSegments(selected);
            setSearchSegment((selectedSegment[0] || {}).label || '');

            setForm(prevState => ({
                ...prevState,
                segment: {
                    ...prevState.segment,
                    id: (selectedSegment[0] || {}).value || '',
                    name: (selectedSegment[0] || {}).label || '',
                    customers: null
                }
            }));
        },
        [segments],
    );

    useEffect(() => {
        if (invitationGroup && invitationGroup.id) {
            setEditMode(true);
            setForm(prevState => ({
                ...prevState,
                name: invitationGroup.name,
            }));
        } else {
            fetchSegments();
        }
    }, []);

    return (
        <Modal
            id="invitation-group-create"
            sectioned
            open={openCreateInvitationModal}
            onClose={() => setOpenCreateInvitationModal(false)}
            title={`${editMode ? 'Update' : 'Create'} Invitation Group`}
            primaryAction={{
                content: editMode ? 'Update' : 'Create',
                disabled: !editMode && (!(form.segment && form.segment.customers && form.segment.customers > 0) || !form.name || loader.createLoading),
                loading: loader.createLoading,
                onAction: () => editMode ? handleUpdateInvitationGroup() : handleCreateInvitationGroup(),
            }}
            secondaryActions={[
                {
                    content: 'Discard',
                    disabled: loader.createLoading,
                    onAction: () => setOpenCreateInvitationModal(false),
                },
            ]}
        >
            <Modal.Section>
                <BlockStack gap="300">
                    {!editMode && <Banner tone="info">
                        <InlineStack gap="100">
                            <p>Select the Shopify Segment or first create a segment</p>
                            <Link url="https://admin.shopify.com/store/demo-upsolite/customers/segments/new" external>
                                here
                            </Link>
                        </InlineStack>
                    </Banner>}

                    <TextField
                        id="name"
                        label="Name"
                        value={form.name}
                        onChange={(value) => {
                            setForm(prevState => ({...prevState, name: value}))
                            setFormErrors(prevState => ({
                                ...prevState,
                                name: value ? '' : 'Name field is required'
                            }));
                        }}
                        autoComplete="off"
                        clearButton
                        onClearButtonClick={() => {
                            setForm(prevState => ({...prevState, name: ''}))
                            setFormErrors(prevState => ({
                                ...prevState,
                                name: 'Name field is required'
                            }));
                        }}
                        error={!!formErrors.name}
                    />
                    {formErrors.name && <InlineError message={formErrors.name} fieldID="name"/>}

                    {!editMode && <Autocomplete
                        options={segments}
                        selected={selectedSegments}
                        onSelect={handleSegmentSelection}
                        loading={loader.segmentLoading}
                        textField={<>
                            <Autocomplete.TextField
                                id="segment"
                                onChange={handleSegmentSearch}
                                clearButton
                                onClearButtonClick={() => handleSegmentSearch('')}
                                label="Segment"
                                value={searchSegment}
                                prefix={<Icon source={SearchIcon} tone="base"/>}
                                placeholder="Select customer segment"
                                autoComplete="off"
                                connectedRight={
                                    <Button loading={loader.fetchSegmentLoading} onClick={handleFetchCustomers}
                                            size="large" disabled={!(form.segment && form.segment.id)}>
                                        Fetch
                                    </Button>
                                }
                                error={!!formErrors.segment}
                                disabled={editMode}
                            />
                            {formErrors.segment && <InlineError message={formErrors.segment} fieldID="segment"/>}
                        </>}
                    />}

                    {(form.segment && (form.segment.customers || form.segment.customers === 0)) && (
                        <Text as="p" variant="bodyMd" fontWeight="bold">
                            Customers Found: {form.segment && form.segment.customers}
                        </Text>
                    )}
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
};

export default InvitationGroupCreate;
