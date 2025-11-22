import {
    FormLayout,
    Layout,
    Card,
    TextField,
    BlockStack,
    Divider, Button, Tooltip, Icon,
} from '@shopify/polaris';
import React, {useState} from "react";
import {API} from "../../api";
import {ClipboardIcon} from "@shopify/polaris-icons";
import {useAppBridge} from "@shopify/app-bridge-react";
import {isEligible, textFieldValue} from "../../helpers";
import {useSelector} from "react-redux";
import {FEATURES} from "../../constants";
import usePlanUpgradePrompt from "../../components/PlanUpgradePrompt";

function ApiSettings({settings, setSettings}) {

    const shopify = useAppBridge();
    const planUpgradePrompt = usePlanUpgradePrompt();
    const [loader, setLoader] = useState({
        createApiTokenLoading: false,
    });
    const shop = useSelector(state => state.shopStore?.shop);

    const group = 'api';

    const handleApiTokenCreate = async () => {
        if (!isEligible(shop, FEATURES.LOGIN_HELPER)) {
            return planUpgradePrompt(shop?.plan);
        }
        try {
            setLoader(prevState => ({...prevState, createApiTokenLoading: true}));

            const { data } = await API.post('/app/api-tokens', {});
            let token = data.api_token?.token;

            if (!token) {
                shopify?.toast?.show('Unable to create api token', {isError: true});
                return;
            }

            setSettings(prevState => ({
                ...prevState,
                [group]: {
                    ...prevState[group],
                    token: {
                        ...prevState[group].token,
                        value: token,
                    },
                }
            }));

            shopify?.toast?.show('Api token created successfully');

        } catch (e) {
            shopify?.toast?.show('Failed to generate Api token', {isError: true});
        } finally {
            setLoader(prevState => ({...prevState, createApiTokenLoading: false}));
        }
    }

    const handleCopyApiToken = async () => {
        await navigator.clipboard.writeText(settings[group].token.value || '');
        shopify?.toast?.show('Api token copied to your clipboard');
    }

    return (
        <div style={{ marginTop: "8px"}}>
            <BlockStack gap="100">
                <Divider borderColor="border"/>
                <Layout sectioned>
                    <Layout.AnnotatedSection
                        id="api_settings"
                        title="Api Settings"
                        description="Api settings"
                    >
                        <Card>
                            <FormLayout>
                                {
                                    settings[group].token.value ?
                                        <TextField
                                            label="Api Token"
                                            autoComplete="Api token"
                                            disabled={true}
                                            onChange={(value) => setSettings(prevState => ({
                                                ...prevState,
                                                [group]: {
                                                    ...prevState[group],
                                                    token: {
                                                        ...prevState[group].token,
                                                        value: value,
                                                    },
                                                }
                                            }))}
                                            value={textFieldValue(settings[group].token.value)}
                                            connectedRight={
                                                <Button
                                                    onClick={handleCopyApiToken}
                                                    size="large"
                                                    disabled={!settings[group].token.value}
                                                >
                                                    <Icon source={ClipboardIcon} tone="base"/>
                                                </Button>
                                            }
                                        />
                                        : <Tooltip content="Generate api token to make api calls from frontend">
                                            <Button
                                                loading={loader.createApiTokenLoading}
                                                onClick={handleApiTokenCreate}
                                                variant="primary"
                                            >
                                                Generate Api Token
                                            </Button>
                                        </Tooltip>
                                }
                            </FormLayout>
                        </Card>
                    </Layout.AnnotatedSection>
                </Layout>
            </BlockStack>
        </div>
    );
}

export default ApiSettings;
