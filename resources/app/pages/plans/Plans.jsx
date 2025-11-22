import {
    BlockStack, Box,
    Button,
    Card,
    Divider,
    Icon,
    InlineGrid,
    InlineStack,
    Page,
    Text,
    TextField,
    SkeletonPage,
    Layout,
    LegacyCard,
    SkeletonBodyText,
    TextContainer,
    Select,
    SkeletonDisplayText, Grid, Modal, DataTable,
} from "@shopify/polaris";
import React, {useCallback, useEffect, useState} from "react";
import {
    CheckIcon,
    XIcon,
    AlertTriangleIcon, InfoIcon
} from "@shopify/polaris-icons";
import {API} from "../../api";
import { useSelector } from "react-redux";
import PlanInfo from "./PlanInfo";
import {FEATURES} from "../../constants";
import {useAppBridge} from "@shopify/app-bridge-react";

function Plans() {

    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState([]);
    const [devPlan, setDevPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalCustomers, setTotalCustomers] = useState('0');
    const [totalCharge, setTotalCharge] = useState('0');
    const [infoModal, setInfoModal] = useState(false);
    const [selected, setSelected] = useState('pro');

    const handleSelectChange = useCallback((value) => setSelected(value), [],);

    const planOptions = [
        {label: 'Pro', value: 'pro'},
        {label: 'Free', value: 'free'},
    ];
    const shopify = useAppBridge();
    const shop = useSelector(state => state.shopStore?.shop);

    const getPlans = async () => {
        try {
            setLoading(true);
            setPageLoading(true);
            const response = await API.get('/app/plans');
            const plans = response.data?.plans || [];
            const currentPlanData = response.data?.plan;
            const filteredPlans = plans.filter(plan => {
                if (plan.slug === 'pro-old') {
                    return currentPlanData?.slug === 'pro-old';
                }
                return true;
            });

            setPlans(filteredPlans);
            setDevPlans(plans?.[1] || []);
            setCurrentPlan(currentPlanData);
        } catch (e) {
            console.error('Failed to fetch plans', e);
        } finally {
            setLoading(false);
            setPageLoading(false);
        }
    };

    const handleCustomersChange = (value) => {
        setTotalCustomers(value);
    }

    const calculateTotalCharge = async () => {
        if (selected === 'free') return setTotalCharge('0');
        if (!totalCustomers || totalCustomers <= 5000) return setTotalCharge('0');

        let countable = totalCustomers - 5000;
        let chargeAmount = countable * 0.001;
        chargeAmount = chargeAmount <= 50 ? chargeAmount : 50;
        setTotalCharge(chargeAmount?.toFixed(3)?.toString());
    }

    const createCharge = async (plan, index) => {
        setLoading(true);
        setCurrentIndex(index);

        if (plan.slug === 'bulk-invite') {
            const uniqueChargeId = `${shop.id}000${Math.floor(Date.now() / 1000)}`;
            window.top.location.href = `/billing/process/${plan.id}?shop=${shopify?.config?.shop}&host=${shopify?.config?.host}&charge_id=${uniqueChargeId}`;
        } else {
            return window.location.href=`
            /billing/${plan.id}?shop=${shop?.name}`;
        }
    }


    const completeOnboarding = async () => {
        if (shop?.onboarding) return;

        try {
            await API.get(`/app/plans/onboard`);
        } catch (e) {
            console.log(e)
        }
    }

    const planCostCalculator = (
        plans.length > 0 && (
                <Card>
                    <BlockStack gap="400">
                        <InlineStack gap="100" blockAlign="center">
                            <Text as="h2" variant="headingLg">
                                Invite cost calculator
                            </Text>
                            <span style={{cursor: "pointer"}} onClick={() => setInfoModal(true)}>
                                            <Icon source={InfoIcon} />
                                        </span>
                        </InlineStack>

                        <InlineGrid gap="300" columns={4}>
                            <Select
                                label="Plan"
                                labelInline
                                options={planOptions}
                                onChange={handleSelectChange}
                                value={selected}
                            />
                            <TextField
                                type="number"
                                autoComplete="off"
                                placeholder="Customers"
                                value={selected === 'free' ? 5000 : totalCustomers}
                                onChange={handleCustomersChange}
                                label=""
                                disabled={selected === 'free'}
                            />
                            <TextField
                                type="number"
                                prefix="$"
                                value={totalCharge}
                                autoComplete="off"
                                disabled={true}
                                label=""
                            />
                            <Button
                                variant="primary"
                                accessibilityLabel={`Calculate`}
                                size="large"
                                onClick={calculateTotalCharge}
                                disabled={selected === 'free'}
                            >
                                Calculate
                            </Button>
                        </InlineGrid>
                    </BlockStack>
                </Card>
            )
    )

    useEffect(() => {
        getPlans();
        completeOnboarding();
    }, []);

    const getDiscountPrice = (plan) => {
        let discountAmount = plan.discount?.amount || 0;
        if (discountAmount) {
            return plan.price - discountAmount;
        }

        return plan.price;
    }

    return (
        <Page title={shop?.development_store ? 'Plan' : 'Plans'}>
            {pageLoading ? (
                <SkeletonPage primaryAction={false}>
                    <Layout>
                        <Layout.Section>
                            <LegacyCard sectioned>
                                <TextContainer>
                                    <SkeletonDisplayText size="small" />
                                    <SkeletonBodyText />
                                </TextContainer>
                            </LegacyCard>
                        </Layout.Section>
                    </Layout>
                </SkeletonPage>
            ) : (
                shop?.development_store ? (
                    <BlockStack gap="400">
                        <Card>
                            <InlineGrid gap="400" columns={3}>
                                <BlockStack gap="400">
                                    <BlockStack gap="200">
                                        <Text as="h2" variant="headingLg">
                                            Developers
                                        </Text>
                                        <Text as="p" variant="bodyMd" fontWeight="medium" tone="subdued">
                                            Free for Shopify development stores.
                                            Access all features with Shopify's 5-invite
                                            limitation—ideal for testing and building.
                                        </Text>
                                    </BlockStack>
                                    <BlockStack gap="200">
                                        <InlineStack gap="100" align="start" blockAlign="baseline">
                                            <Text as="h2" variant="heading2xl">
                                                $0
                                            </Text>
                                            <Text as="span" variant="bodyLg" tone="subdued">
                                                /month
                                            </Text>
                                        </InlineStack>
                                        <Text as="p" variant="bodyMd" fontWeight="medium" tone="subdued">
                                            Free while you build
                                        </Text>
                                    </BlockStack>
                                    <Button
                                        variant="primary"
                                        disabled={true}
                                        accessibilityLabel={`Current Developer Plan`}
                                        fullWidth
                                        size="large"
                                    >
                                        Current Plan
                                    </Button>
                                </BlockStack>
                                <BlockStack gap="300">
                                    <Box background="bg-fill-secondary" padding="400" >
                                        <Grid columns={{ sm: 3 }}>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 8, xl: 12 }}>
                                                <Text variant="headingSm" as="h6">
                                                    Features
                                                </Text>
                                            </Grid.Cell>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 8, xl: 12 }}>
                                                {devPlan?.features?.map((feature, featureIndex) => (
                                                    <InlineStack key={featureIndex} gap="200" align="start" blockAlign="center">
                                                        {feature.type === 'bool' ? (
                                                                <>
                                                                    <Box maxWidth="300" minWidth="300">
                                                                        <Icon source={feature.value ? CheckIcon : XIcon} />
                                                                    </Box>
                                                                    <Text as="span" variant="bodyMd">
                                                                        {feature.name}
                                                                    </Text>
                                                                </>
                                                            ):
                                                            ''
                                                        }
                                                    </InlineStack>
                                                ))}
                                            </Grid.Cell>
                                        </Grid>
                                    </Box>
                                </BlockStack>
                                <BlockStack gap="300">
                                    <Box background="bg-fill-secondary" padding="400">
                                        <Grid columns={{ sm: 3 }}>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 8, xl: 12 }}>
                                                <Text variant="headingSm" as="h6">
                                                    Limitations
                                                </Text>
                                            </Grid.Cell>
                                            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 12, lg: 12, xl: 12 }}>
                                                <InlineStack gap="200" align="start" blockAlign="center" wrap={false}>
                                                    <>
                                                        <Box maxWidth="300" minWidth="300">
                                                            <Icon source={AlertTriangleIcon}/>
                                                        </Box>
                                                        <Text as="span" variant="bodyMd">
                                                            Free until store activation
                                                        </Text>
                                                    </>
                                                </InlineStack>
                                                <InlineStack gap="200" align="start" blockAlign="center" wrap={false}>
                                                    <>
                                                        <Box maxWidth="300" minWidth="300">
                                                            <Icon source={AlertTriangleIcon}/>
                                                        </Box>
                                                        <Text as="span" variant="bodyMd">
                                                            5-invite at a time
                                                        </Text>
                                                    </>
                                                </InlineStack>
                                            </Grid.Cell>
                                        </Grid>
                                    </Box>
                                </BlockStack>
                            </InlineGrid>
                        </Card>
                        {planCostCalculator}
                    </BlockStack>

                ) : (
                    <BlockStack gap="400">
                        <Grid gap="400" columns={currentPlan?.slug === 'pro-old' ? 3 : 2}>
                            {plans.map((plan, index) => (
                                <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: currentPlan?.slug === 'pro-old' ? 4 : 6, xl: currentPlan?.slug === 'pro-old' ? 4 : 6}} key={index}>
                                    <Card key={index}>
                                    <BlockStack gap="600">
                                        <BlockStack gap="200">
                                            <Text as="h2" variant="headingLg">
                                                {plan.name}
                                            </Text>
                                            <Text as="p" variant="bodyMd" fontWeight="medium" tone="subdued">
                                                {plan.description}
                                            </Text>
                                        </BlockStack>
                                        <BlockStack gap="300">
                                            <BlockStack>
                                                <InlineStack gap="100" blockAlign="baseline">
                                                    {plan.discount?.amount ?
                                                        <>
                                                        <span style={{textDecoration: 'line-through'}}>
                                                            <Text as="h5" className="strikethrough" fontWeight="medium" tone="subdued" variant="headingXl">
                                                                ${plan.price}
                                                            </Text>
                                                        </span>
                                                        <Text as="h2" variant="heading2xl">
                                                            ${getDiscountPrice(plan)}
                                                        </Text>
                                                        </>:
                                                        <Text as="h2" variant="heading2xl">
                                                            ${getDiscountPrice(plan)}
                                                        </Text>
                                                    }
                                                    <Text as="span" variant="bodyLg" tone="subdued">
                                                        /month
                                                    </Text>
                                                </InlineStack>
                                                {plan.capped_amount ? <Text as="span" variant="bodyLg" tone="subdued">
                                                    $0.001/invite after limit (capped at $50/month)
                                                </Text> : '' }

                                            </BlockStack>
                                            <Divider/>
                                            <BlockStack gap="300">
                                                {plan.features
                                                    ?.slice()
                                                    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                                                    .map((feature, featureIndex) => (
                                                    <div style={feature.slug === FEATURES.MULTIPASS_LOGIN && !shop?.shopify_plus && !shop?.development_store ? {display: 'none'} : {}} key={featureIndex}>
                                                        <InlineStack key={featureIndex} gap="200" align="start" blockAlign="center">
                                                            <Box maxWidth="300" minWidth="300">
                                                                {feature.type === 'bool' ? (
                                                                    <Icon source={feature.value ? CheckIcon : XIcon} />
                                                                ) : (
                                                                    <Text as="span" variant="bodyLg">
                                                                        {feature.value}
                                                                    </Text>
                                                                )}
                                                            </Box>
                                                            <Text as="span" variant="bodyMd">
                                                                {feature.name}
                                                            </Text>
                                                        </InlineStack>
                                                    </div>
                                                ))}
                                            </BlockStack>
                                        </BlockStack>
                                        <BlockStack gap="300">
                                            <Divider/>
                                            <Button
                                                variant="primary"
                                                onClick={() => {
                                                    createCharge(plan, index)
                                                }}
                                                loading={loading && currentIndex == index}
                                                disabled={plan.id == currentPlan?.id || (loading && currentIndex == index)}
                                                accessibilityLabel={`Select ${plan.name} Plan`}
                                                fullWidth
                                                size="large"
                                            >
                                                {plan.id == currentPlan?.id
                                                    ? 'Current Plan'
                                                    : (currentPlan?.id ? 'Change Plan' : 'Select Plan')}
                                            </Button>
                                        </BlockStack>
                                    </BlockStack>
                                </Card>
                                </Grid.Cell>
                            ))}
                        </Grid>

                        {planCostCalculator}
                    </BlockStack>
                )
            )}

            {infoModal && <PlanInfo infoModal={infoModal} setInfoModal={setInfoModal}></PlanInfo>}

            <div style={{TextAlign: "center", padding: "12px"}}>
                <Text as="p" alignment="center">Build with ❤️ by UpSolite, ©2025.</Text>
            </div>

        </Page>
    );
}
export default Plans;
