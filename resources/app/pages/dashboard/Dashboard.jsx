import {
    BlockStack,
    Button,
    CalloutCard,
    Card,
    Grid,
    List,
    Page,
    Text,
    SkeletonPage,
    Layout,
    LegacyCard,
    SkeletonBodyText,
    TextContainer,
    SkeletonDisplayText,
    InlineStack,
    Box,
    Icon,
    Banner,
    LegacyStack,
    Collapsible,
    Modal,
    TextField
} from "@shopify/polaris";
import {useSelector} from "react-redux";
import React, {useEffect, useState, useCallback} from "react";
import {
    PersonSegmentIcon,
    PersonFilledIcon,
    PersonIcon,
    InfoIcon,
    CaretUpIcon,
    CaretDownIcon, CashDollarIcon
} from "@shopify/polaris-icons";
import {API} from "../../api";
import {useNavigate} from "react-router-dom";
import ConfirmStart from "../invitation_groups/ConfirmStart";
import GuideModal from "./GuideModal";
import Activity from "./Activity";
import TrialInfo from "./TrialInfo";

function Dashboard() {

    const shop = useSelector(state => state.shopStore?.shop);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const navigate = useNavigate();
    const [openConfirmStartModal, setOpenConfirmStartModal] = useState(false);
    const [openGuideModal, setOpenGuideModal] = useState(false);
    const [guideModalType, setGuideModalType] = useState(false);
    const [invitationGroups, setInvitationGroups] = useState([]);
    const [showPlanWarning, setShowPlanWarning] = useState(true);
    const [trialModal, setTrialModal] = useState(false);
    const [loader, setLoader] = useState({
        cancelLoading: false,
        startLoading: false,
        updateLoading: false,
        deleteLoading: false,
        exportLoading: false,
        queryLoading: false,
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
    const [themeUrl, setThemUrl] = useState('');
    const [open, setOpen] = useState(false);
    const [openSections, setOpenSections] = useState([true, false, false, false]);
    const [openContactModel, setOpenContactModel] = useState(false)
    const [isShopifyPlus, setIsShopifyPlus] = useState(false)
    const [contactInfo, setContactInfo] = useState({
        email:'',
        content:''
    })
    const handleToggle = useCallback(() => setOpen((open) => !open), []);

    const handleChange = useCallback(() => setOpenContactModel(!openContactModel), [openContactModel]);

    useEffect(() => {
        setShowPlanWarning(!shop?.development_store && !shop?.plan_id)
        let appId = process.env.MIX_SHOPIFY_API_KEY;
        if (shop?.name && appId) {
            setThemUrl(`https://${shop?.name}/admin/themes/current/editor?context=apps&activateAppId=${appId}/index`);
        }
        setIsShopifyPlus(shop?.shopify_plus || shop?.development_store || false);
    }, [shop]);

    const redirectToThemeCustomization = async () => {
        try {
            await API.get('/app/dashboard/onboard');
            window.open(themeUrl || '/')
        } catch (e) {
            console.error('Failed to fetch plans', e);
        }
    }

    const handleToggleSection = useCallback((index) => {
        setOpenSections(prev => {
            return prev.map((isOpen, i) => {
                if (i === index) return !isOpen;
                return false;
            });
        });
    }, []);

    const getData = async () => {
        try {
            setLoading(true);
            const response = await API.get('/app/dashboard');
             setData(response.data)
             setTrialModal(response.data?.showTrialModal || false);
        } catch (e) {
            console.error('Failed to fetch plans', e);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteModel = () => {
        if (data?.allInvitedOnce) {
            return navigate('/invitation-groups');
        }
        setOpenConfirmStartModal(true)
    };

    const iconContent = () =>{
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#000"></circle>
                <path d="M17.2738 8.52629C17.6643 8.91682 17.6643 9.54998 17.2738 9.94051L11.4405 15.7738C11.05 16.1644 10.4168 16.1644 10.0263 15.7738L7.3596 13.1072C6.96908 12.7166 6.96908 12.0835 7.3596 11.693C7.75013 11.3024 8.38329 11.3024 8.77382 11.693L10.7334 13.6525L15.8596 8.52629C16.2501 8.13577 16.8833 8.13577 17.2738 8.52629Z" fill="#ffffff"></path>
            </svg>
        )
    }
    const circleIconContent = () =>{
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10.5334 2.10692C11.0126 2.03643 11.5024 2 12 2C12.4976 2 12.9874 2.03643 13.4666 2.10692C14.013 2.18729 14.3908 2.6954 14.3104 3.2418C14.23 3.78821 13.7219 4.166 13.1755 4.08563C12.7924 4.02927 12.3999 4 12 4C11.6001 4 11.2076 4.02927 10.8245 4.08563C10.2781 4.166 9.76995 3.78821 9.68958 3.2418C9.6092 2.6954 9.987 2.18729 10.5334 2.10692ZM7.44122 4.17428C7.77056 4.61763 7.67814 5.24401 7.23479 5.57335C6.603 6.04267 6.04267 6.603 5.57335 7.23479C5.24401 7.67814 4.61763 7.77056 4.17428 7.44122C3.73094 7.11188 3.63852 6.4855 3.96785 6.04216C4.55386 5.25329 5.25329 4.55386 6.04216 3.96785C6.4855 3.63852 7.11188 3.73094 7.44122 4.17428ZM16.5588 4.17428C16.8881 3.73094 17.5145 3.63852 17.9578 3.96785C18.7467 4.55386 19.4461 5.25329 20.0321 6.04216C20.3615 6.4855 20.2691 7.11188 19.8257 7.44122C19.3824 7.77056 18.756 7.67814 18.4267 7.23479C17.9573 6.603 17.397 6.04267 16.7652 5.57335C16.3219 5.24401 16.2294 4.61763 16.5588 4.17428ZM3.2418 9.68958C3.78821 9.76995 4.166 10.2781 4.08563 10.8245C4.02927 11.2076 4 11.6001 4 12C4 12.3999 4.02927 12.7924 4.08563 13.1755C4.166 13.7219 3.78821 14.23 3.2418 14.3104C2.6954 14.3908 2.18729 14.013 2.10692 13.4666C2.03643 12.9874 2 12.4976 2 12C2 11.5024 2.03643 11.0126 2.10692 10.5334C2.18729 9.987 2.6954 9.6092 3.2418 9.68958ZM20.7582 9.68958C21.3046 9.6092 21.8127 9.987 21.8931 10.5334C21.9636 11.0126 22 11.5024 22 12C22 12.4976 21.9636 12.9874 21.8931 13.4666C21.8127 14.013 21.3046 14.3908 20.7582 14.3104C20.2118 14.23 19.834 13.7219 19.9144 13.1755C19.9707 12.7924 20 12.3999 20 12C20 11.6001 19.9707 11.2076 19.9144 10.8245C19.834 10.2781 20.2118 9.76995 20.7582 9.68958ZM4.17428 16.5588C4.61763 16.2294 5.24401 16.3219 5.57335 16.7652C6.04267 17.397 6.603 17.9573 7.23479 18.4267C7.67814 18.756 7.77056 19.3824 7.44122 19.8257C7.11188 20.2691 6.4855 20.3615 6.04216 20.0321C5.25329 19.4461 4.55386 18.7467 3.96785 17.9578C3.63852 17.5145 3.73094 16.8881 4.17428 16.5588ZM19.8257 16.5588C20.2691 16.8881 20.3615 17.5145 20.0321 17.9578C19.4461 18.7467 18.7467 19.4461 17.9578 20.0321C17.5145 20.3615 16.8881 20.2691 16.5588 19.8257C16.2294 19.3824 16.3219 18.756 16.7652 18.4267C17.397 17.9573 17.9573 17.397 18.4267 16.7652C18.756 16.3219 19.3824 16.2294 19.8257 16.5588ZM9.68958 20.7582C9.76995 20.2118 10.2781 19.834 10.8245 19.9144C11.2076 19.9707 11.6001 20 12 20C12.3999 20 12.7924 19.9707 13.1755 19.9144C13.7219 19.834 14.23 20.2118 14.3104 20.7582C14.3908 21.3046 14.013 21.8127 13.4666 21.8931C12.9874 21.9636 12.4976 22 12 22C11.5024 22 11.0126 21.9636 10.5334 21.8931C9.987 21.8127 9.6092 21.3046 9.68958 20.7582Z" fill="#8A8A8A"></path>
                <circle cx="12" cy="12" r="9" fill="#F6F6F7" stroke="#999EA4" strokeWidth="2" className="CompleteCheckbox-module_Icon-circle__FXe3l"></circle>
            </svg>
        )
    }

    const handleContactChange = (field) => (value) => {
        setContactInfo((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleContactSubmit = async () =>{

        if (!isValidEmail(contactInfo.email)) {
            return shopify.toast.show('Please enter valid email address', {isError: true});
        }
        if (!contactInfo.content) {
            return shopify.toast.show('Please enter content details', {isError: true});
        }

        setLoader(prev => ({ ...prev, queryLoading: true }));

        try {
            const response = await API.post('/app/dashboard/customer-queries', contactInfo);
            shopify.toast.show(response.data.message, { isError: false });

            setContactInfo({ email: '', content: '' });
        } catch (error) {
            shopify.toast.show(
                error.response?.data?.message || 'Unable to submit query.',
                { isError: true }
            );
        } finally {
            setLoader(prev => ({ ...prev, queryLoading: false }));
            setOpenContactModel(false)
        }
    }

    const stepCount = () => {
        let count = 0;
        if (data?.customers && data?.customers > 0) count += 1;
        if (data?.isInvitationGroup) count += 1;
        if (data?.isSettingDone) count += 1;
        if (data?.themeCustomization) count += 1;

        return `${count}/4 completed`;
    }
    const isValidEmail = (email) => {
        if (!email) return false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    useEffect(() => {
        getData();
    }, []);

    const handleGuideModal = (type) => {
        setGuideModalType(type);
        setOpenGuideModal(true)
    }

    return (
        <div>
            <Page title="Dashboard">
                {loading ?
                    <SkeletonPage primaryAction>
                        <Layout>
                            <Layout.Section>
                                <LegacyCard sectioned>
                                    <SkeletonBodyText />
                                </LegacyCard>
                                <LegacyCard sectioned>
                                    <TextContainer>
                                        <SkeletonDisplayText size="small" />
                                        <SkeletonBodyText />
                                    </TextContainer>
                                </LegacyCard>
                                <LegacyCard sectioned>
                                    <TextContainer>
                                        <SkeletonDisplayText size="small" />
                                        <SkeletonBodyText />
                                    </TextContainer>
                                </LegacyCard>
                            </Layout.Section>
                            <Layout.Section>
                                <LegacyCard>
                                    <LegacyCard.Section>
                                        <TextContainer>
                                            <SkeletonDisplayText size="small" />
                                            <SkeletonBodyText lines={2} />
                                        </TextContainer>
                                    </LegacyCard.Section>
                                    <LegacyCard.Section>
                                        <SkeletonBodyText lines={1} />
                                    </LegacyCard.Section>
                                </LegacyCard>
                                <LegacyCard subdued>
                                    <LegacyCard.Section>
                                        <TextContainer>
                                            <SkeletonDisplayText size="small" />
                                            <SkeletonBodyText lines={2} />
                                        </TextContainer>
                                    </LegacyCard.Section>
                                    <LegacyCard.Section>
                                        <SkeletonBodyText lines={2} />
                                    </LegacyCard.Section>
                                </LegacyCard>
                            </Layout.Section>
                        </Layout>
                    </SkeletonPage> :
                    <Grid>
                        {showPlanWarning ?
                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <Banner
                                title="You need to select the plan"
                                action={{content: 'Select Plan', onAction: () => navigate('/plans')}}
                                tone="warning"
                                onDismiss={() => {setShowPlanWarning(false)}}
                            >
                                <List>
                                    <List.Item>
                                        We’re glad you’re using our app! If you’re ready for more, upgrade anytime to unlock extra features
                                    </List.Item>
                                </List>
                            </Banner>
                        </Grid.Cell> : ''}
                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <Box
                                width="100%"
                                padding="400"
                                borderRadius="200"
                                background="bg-surface"
                                borderColor="border"
                                borderWidth="025"
                                display="flex"
                                minHeight="32px"
                                cursor="pointer"
                            >
                                <BlockStack gap='400'>
                                    <CalloutCard
                                        title="UpSolite Bulk Invite & Login"
                                        illustration="/images/invitation-illustration.svg"
                                        primaryAction={{
                                            content: 'Explore now',
                                            onAction: () => navigate('/customers'),
                                        }}
                                    >
                                        <p>Manage customer logins and send bulk invitations effortlessly.</p>
                                    </CalloutCard>
                                    <Grid>
                                        <Grid.Cell columnSpan={isShopifyPlus ? {xs: 6, sm: 6, md: 4, lg: 4, xl: 4} : {xs: 6, sm: 6, md: 6, lg: 6, xl: 6}}>
                                            <Box background='bg-surface-secondary' padding="400" borderRadius="200">
                                                <BlockStack gap="200">
                                                    <InlineStack>
                                                        <Text as='h3' variant='headingSm'>Send bulk invitations</Text>
                                                        <div style={{display: 'flex', alignItems: 'center', cursor: "pointer"}} onClick={() => handleGuideModal('bulk-invite')}>
                                                            <span><Icon source={InfoIcon} /></span>
                                                        </div>
                                                    </InlineStack>
                                                    <Text as='p' variant='bodySm'>Invite multiple customers in groups or all at once — save time with a single click.</Text>
                                                </BlockStack>
                                            </Box>
                                        </Grid.Cell>
                                        {isShopifyPlus ?
                                            <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 4, lg: 4, xl: 4}}>
                                                <Box background='bg-surface-secondary' padding="400" borderRadius="200">
                                                    <BlockStack gap="200">
                                                        <InlineStack>
                                                            <Text as='h3' variant='headingSm'>Login as customer</Text>
                                                            <div style={{display: 'flex', alignItems: 'center', cursor: "pointer"}} onClick={() => handleGuideModal('login-helper')}>
                                                                <span><Icon source={InfoIcon} /></span>
                                                            </div>
                                                        </InlineStack>
                                                        <Text as='p' variant='bodySm'>Enable merchants to login as a customer-making support faster and more accurate.</Text>
                                                    </BlockStack>
                                                </Box>
                                            </Grid.Cell>  : ''}
                                        <Grid.Cell columnSpan={isShopifyPlus ? {xs: 6, sm: 6, md: 4, lg: 4, xl: 4} : {xs: 6, sm: 6, md: 6, lg: 6, xl: 6}}>
                                            <Box background='bg-surface-secondary' padding="400" borderRadius="200">
                                                <BlockStack gap="200">
                                                    <InlineStack>
                                                        <Text as='h3' variant='headingSm'>Frontend login helper</Text>
                                                        <div style={{display: 'flex', alignItems: 'center', cursor: "pointer"}} onClick={() => handleGuideModal('front-login')}>
                                                            <span><Icon source={InfoIcon} /></span>
                                                        </div>
                                                    </InlineStack>
                                                    <Text as='p' variant='bodySm'>Automatically prompt an invite when a disabled customer attempts to Sign in.</Text>
                                                </BlockStack>
                                            </Box>
                                        </Grid.Cell>
                                    </Grid>
                                </BlockStack>
                            </Box>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <LegacyCard sectioned>
                                <LegacyStack vertical>
                                    <BlockStack gap="300">
                                        <InlineStack wrap={false} align="space-between">
                                            <Text as="h2" variant="headingMd">App setup guide</Text>
                                            <Button
                                                onClick={handleToggle}
                                                ariaExpanded={open}
                                                ariaControls="basic-collapsible"
                                                 variant="tertiary"
                                                icon={open ? CaretUpIcon : CaretDownIcon}
                                            />
                                        </InlineStack>
                                        <BlockStack as="div" gap="400">
                                            <Text as="p">Use this guide to get this app up and running on your store.</Text>
                                            <div style={{width:"fit-content",cursor:"pointer"}} onClick={handleToggle}>
                                                <Box borderColor="border" borderWidth="025" borderRadius="200" paddingInline="200" width="auto">
                                                    <Text as="p">{stepCount()}</Text>
                                                </Box>
                                            </div>
                                        </BlockStack>
                                        <Collapsible
                                            open={open}
                                            id="basic-collapsible"
                                            transition={{duration: '100ms', timingFunction: 'ease-in-out'}}
                                            expandOnPrint
                                        >
                                            <TextContainer>
                                                {[
                                                    {
                                                        title: "Sync customers",
                                                        content: "Sync your store’s customers to send invites and manage customer-related features.",
                                                        buttonText: "Sync customers",
                                                        onAction: () => navigate('/customers'),
                                                        completed: data?.customers && parseInt(data?.customers) > 0
                                                    },
                                                    {
                                                        title: "Create invitation group",
                                                        content: "Create and manage invitation groups for bulk invites.",
                                                        buttonText: "Invitation Groups",
                                                        onAction: () => navigate('/invitation-groups'),
                                                        completed: data?.isInvitationGroup
                                                    },
                                                    {
                                                        title: "Frontend login helper",
                                                        content: "Activate the Login Helper feature by enabling the app embed in your store's customization settings.",
                                                        buttonText: "Enable",
                                                        onAction: redirectToThemeCustomization,
                                                        completed: data?.themeCustomization,
                                                        setInfo: true,
                                                    },
                                                    {
                                                        title: "Configure settings",
                                                        content: "Configure your application settings and preferences.",
                                                        buttonText: "Settings",
                                                        onAction: () => navigate('/settings'),
                                                        completed: data?.isSettingDone
                                                    }
                                                ].map((item, index) => (
                                                    <BlockStack gap="300" key={index}>
                                                        <Box
                                                            background={openSections[index] ? "bg-surface-secondary" : "bg-surface"}
                                                            borderRadius="300"
                                                            padding="200"
                                                        >
                                                            <BlockStack gap={openSections[index] ? '200' : ''}>
                                                                <InlineStack
                                                                    gap="200"
                                                                    wrap={false}
                                                                    blockAlign="center"
                                                                    onClick={() => handleToggleSection(index)}
                                                                >
                                                                    <div style={{height:"24px",width:"24px"}} >
                                                                        <Button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleToggleSection(index);
                                                                            }}
                                                                            ariaExpanded={openSections[index]}
                                                                            ariaControls={`section-${index}`}
                                                                            variant="tertiary"
                                                                            icon={item.completed ? iconContent : circleIconContent}
                                                                            padding="0"
                                                                        />
                                                                    </div>
                                                                    <div onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleSection(index);
                                                                    }} style={{cursor: "pointer"}}>
                                                                        {item.setInfo ?
                                                                            <InlineStack>
                                                                                <Text as="h3" variant={openSections[index] ? 'headingMd' : ''} alignment="start">
                                                                                    {item.title}
                                                                                </Text>
                                                                                <div style={{display: 'flex', alignItems: 'center', cursor: "pointer"}} onClick={(event) => {
                                                                                    event.stopPropagation();
                                                                                    handleGuideModal('front-login')
                                                                                }}>
                                                                                    <span><Icon source={InfoIcon} /></span>
                                                                                </div>
                                                                            </InlineStack>
                                                                        :
                                                                            <Text as="h3" variant={openSections[index] ? 'headingMd' : ''} alignment="start">
                                                                                {item.title}
                                                                            </Text>
                                                                        }
                                                                    </div>
                                                                </InlineStack>
                                                                <InlineStack
                                                                    gap="600"
                                                                    wrap={false}
                                                                    blockAlign="center"
                                                                >
                                                                    <Collapsible
                                                                        open={openSections[index]}
                                                                        id={`section-${index}`}
                                                                        transition={{
                                                                            duration: '100ms',
                                                                            timingFunction: 'ease-in-out'
                                                                        }}
                                                                    >
                                                                        <BlockStack gap="300">
                                                                            <Text as="h3">{item.content}</Text>
                                                                            <InlineStack>
                                                                                <Button size="medium" onClick={item.onAction}
                                                                                        variant="primary">{item.buttonText}</Button>
                                                                            </InlineStack>
                                                                        </BlockStack>
                                                                    </Collapsible>
                                                                </InlineStack>
                                                            </BlockStack>
                                                        </Box>
                                                    </BlockStack>
                                                ))}
                                            </TextContainer>
                                        </Collapsible>
                                    </BlockStack>
                                </LegacyStack>
                            </LegacyCard>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <LegacyCard sectioned>
                                <LegacyStack vertical>
                                    <BlockStack gap="300">
                                        <InlineStack>
                                            <Text as='h3' variant='headingSm'>Auto invites via Shopify Flow</Text>
                                            <div style={{display: 'flex', alignItems: 'center', cursor: "pointer"}} onClick={() => handleGuideModal('flow-invite')}>
                                                <span><Icon source={InfoIcon} /></span>
                                            </div>
                                        </InlineStack>
                                        <BlockStack as="div" gap="400">
                                            <Text as="p">Automatically send account invites when new customers are created or updated — only if their account isn’t already enabled.</Text>
                                        </BlockStack>
                                    </BlockStack>
                                </LegacyStack>
                            </LegacyCard>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <InlineStack align="space-between" blockAlign="center">
                                <Text as="h3" variant="headingMd" fontWeight="bold">
                                    Customers Overview
                                </Text>
                                <Button
                                    variant="primary"
                                    onClick={handleInviteModel}
                                    accessibilityLabel="Add tracking number"
                                >
                                    Invite All
                                </Button>
                            </InlineStack>
                        </Grid.Cell>
                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <Card roundedAbove="sm">
                                <BlockStack gap="200">
                                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
                                        <div style={{flex:"1"}}>
                                            <Grid>
                                                <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 3, lg: 3, xl: 3}}>
                                                    <Box borderColor="border" paddingInline="300" paddingBlock="100" >
                                                        <BlockStack gap="200">
                                                            <Text as="p" fontWeight="medium">
                                                                Total Customers
                                                            </Text>
                                                            <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                                                                <Button size="large" variant="plain" icon={PersonIcon} />
                                                                <Text as="p" variant="bodyLg" fontWeight="semibold">
                                                                    {data?.customers}
                                                                </Text>
                                                            </div>
                                                        </BlockStack>
                                                    </Box>
                                                </Grid.Cell>
                                                <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 3, lg: 3, xl: 3}}>
                                                    <Box borderColor="border" paddingInline="300" paddingBlock="100" borderInlineStartWidth="025">
                                                        <BlockStack gap="200">
                                                            <Text as="p" fontWeight="medium">
                                                                Invited Customers
                                                            </Text>
                                                            <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                                                                <Button size="large" variant="plain" icon={PersonSegmentIcon} />
                                                                <Text as="p" variant="bodyLg" fontWeight="semibold">
                                                                    {data?.invitedCustomers}
                                                                </Text>
                                                            </div>
                                                        </BlockStack>
                                                    </Box>
                                                </Grid.Cell>
                                                <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 3, lg: 3, xl: 3}}>
                                                    <Box borderColor="border" paddingInline="300" paddingBlock="100" borderInlineStartWidth="025">
                                                        <BlockStack gap="200">
                                                            <Text as="p" fontWeight="medium">
                                                                Enabled Customers
                                                            </Text>
                                                            <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                                                                <Button size="large" variant="plain" icon={PersonFilledIcon} />
                                                                <Text as="p" variant="bodyLg" fontWeight="semibold">
                                                                    {data?.enabledCustomers}
                                                                </Text>
                                                            </div>
                                                        </BlockStack>
                                                    </Box>
                                                </Grid.Cell>
                                                <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 3, lg: 3, xl: 3}}>
                                                    <Box borderColor="border" paddingInline="300" paddingBlock="100" borderInlineStartWidth="025">
                                                        <BlockStack gap="200">
                                                            <Text as="p" fontWeight="medium">
                                                                Disabled Customers
                                                            </Text>
                                                            <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                                                                <Button size="large" variant="plain" icon={PersonFilledIcon} />
                                                                <Text as="p" variant="bodyLg" fontWeight="semibold">
                                                                    {data?.disabledCustomers}
                                                                </Text>
                                                            </div>
                                                        </BlockStack>
                                                    </Box>
                                                </Grid.Cell>
                                            </Grid>
                                        </div>
                                    </div>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <InlineStack align="space-between" blockAlign="center">
                                <Text as="h3" variant="headingMd" fontWeight="bold">
                                    Invite Activities
                                </Text>
                                <Button
                                    variant="primary"
                                    onClick={()=> navigate('/charges')}
                                    accessibilityLabel="Add tracking number"
                                >
                                    All Charges
                                </Button>
                            </InlineStack>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <Card roundedAbove="sm">
                                <BlockStack gap="200">
                                    <Grid>
                                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 6, lg: 6, xl: 6}}>
                                            <Box borderColor="border" paddingInline="300" paddingBlock="100" >
                                                <BlockStack gap="200">
                                                    <Text as="p" fontWeight="medium">
                                                       Invitations
                                                    </Text>
                                                    <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                                                        <Button size="large" variant="plain" icon={PersonIcon} />
                                                        <Text as="p" variant="bodyLg" fontWeight="semibold">
                                                            {data?.totalSentInvitations}
                                                        </Text>
                                                    </div>
                                                </BlockStack>
                                            </Box>
                                        </Grid.Cell>
                                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 6, lg: 6, xl: 6}}>
                                            <Box borderColor="border" paddingInline="300" paddingBlock="100" borderInlineStartWidth="025">
                                                <BlockStack gap="200">
                                                    <Text as="p" fontWeight="medium">
                                                        Charges
                                                    </Text>
                                                    <div style={{display:"flex",alignItems:"center",gap:"2px"}}>
                                                        <Button size="large" variant="plain" icon={CashDollarIcon} />
                                                        <Text as="p" variant="bodyLg" fontWeight="semibold">
                                                            ${parseFloat(data?.totalUsageCharge || 0).toFixed(2)}
                                                        </Text>
                                                    </div>
                                                </BlockStack>
                                            </Box>
                                        </Grid.Cell>
                                    </Grid>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <Activity/>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <CalloutCard
                                title="Something missing or not working?"
                                illustration="/images/contact.svg"
                                primaryAction={{
                                    content: 'Contact Us',
                                    url: '#',
                                    onAction: handleChange
                                }}
                            >
                                <BlockStack gap="100">
                                    <Text as="p">
                                        Get expert support when you need it. We respond quickly to technical issues, feature requests, and inquiries with same-day resolution.
                                    </Text>
                                    <Text as="p">
                                        Contact : <strong>support@upsolite.com</strong>
                                    </Text>
                                </BlockStack>
                            </CalloutCard>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{xs: 6, sm: 6, md: 12, lg: 12, xl: 12}}>
                            <div style={{TextAlign: "center", paddingBottom: "12px"}}>
                                <Text as="p" alignment="center">Build with ❤️ by UpSolite, ©2025.</Text>
                            </div>
                        </Grid.Cell>
                    </Grid>
                }
            </Page>

            <Modal
                open={openContactModel}
                onClose={handleChange}
                title="Contact Us"
                primaryAction={{
                    content: 'Contact',
                    onAction: handleContactSubmit,
                    loading: loader.queryLoading
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: handleChange,
                    },
                ]}
            >
                <Modal.Section>
                    <TextContainer>
                        <BlockStack gap="300">
                            <TextField
                                label="Email"
                                type="email"
                                value={contactInfo.email}
                                onChange={handleContactChange('email')}
                                autoComplete="email"
                            />
                            <TextField
                                label="Message"
                                value={contactInfo.content}
                                onChange={handleContactChange('content')}
                                multiline={4}
                                autoComplete="off"
                            />
                            <Text as="p" variant="bodySm" tone="subdued">Our support team is ready to help. Once you submit your request, we’ll get back to you within a few hours.</Text>
                        </BlockStack>
                    </TextContainer>
                </Modal.Section>
            </Modal>

            {openConfirmStartModal &&
            <ConfirmStart
                openConfirmStartModal={openConfirmStartModal}
                setOpenConfirmStartModal={setOpenConfirmStartModal}
                invitationGroup={invitationGroups}
                setInvitationGroup={setInvitationGroups}
                setLoader={setLoader}
                setActions={setActions}
                from="dashboard"
                shop={shop}
            />
            }

            {openGuideModal &&
                <GuideModal
                    openGuideModal={openGuideModal}
                    setOpenGuideModal={setOpenGuideModal}
                    guideModalType={guideModalType}
                    themeUrl={themeUrl}
                />
            }
            {trialModal &&
                <TrialInfo
                    trialModal={trialModal}
                    setTrialModal={setTrialModal}
                    isShopifyPlus={isShopifyPlus}
                />
            }
        </div>
    );
}
export default Dashboard;
