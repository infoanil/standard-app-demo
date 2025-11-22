import {
    FormLayout,
    Layout,
    Card,
    TextField,
    BlockStack,
    Divider,
} from '@shopify/polaris';
import {useSelector} from "react-redux";
import {textFieldValue} from "../../helpers";
import {isEligible} from "../../helpers";
import {useNavigate} from "react-router-dom";
import {FEATURES} from "../../constants";

function GeneralSettings({settings, setSettings}) {

    const shop = useSelector(state => state.shopStore?.shop);
    const navigate = useNavigate();

    const group = 'general';

    return (
        <div style={{ marginTop: "8px"}}>
            <BlockStack gap="100">
                <Divider borderColor="border"/>
                <Layout sectioned>
                    <Layout.AnnotatedSection
                        id="general_settings"
                        title="General Settings"
                        description="General settings"
                    >
                        <Card>
                            <FormLayout>
                                {/*<TextField
                                    type="email"
                                    label="Notification email"
                                    autoComplete="Notification email"
                                    onChange={(value) => setSettings(prevState => ({
                                        ...prevState,
                                        [group]: {
                                            ...prevState[group],
                                            notification_email: {
                                                ...prevState[group].notification_email,
                                                value: value,
                                            },
                                        }
                                    }))}
                                    value={settings[group].notification_email.value ? textFieldValue(settings[group].notification_email.value) : shop?.email}
                                />*/}

                                <TextField
                                    label="Multipass Token (Shopify Plus)"
                                    autoComplete="Multipass token"
                                    disabled={!isEligible(shop, FEATURES.MULTIPASS_LOGIN)}
                                    labelAction={{content: isEligible(shop, FEATURES.MULTIPASS_LOGIN) ? '' : 'Upgrade Plan', onAction: () => navigate('/plans')}}
                                    onChange={(value) => setSettings(prevState => ({
                                        ...prevState,
                                        [group]: {
                                            ...prevState[group],
                                            multi_pass_token: {
                                                ...prevState[group].multi_pass_token,
                                                value: value,
                                            },
                                        }
                                    }))}
                                    value={textFieldValue(settings[group].multi_pass_token.value)}
                                />

                            </FormLayout>
                        </Card>
                    </Layout.AnnotatedSection>
                </Layout>
            </BlockStack>
        </div>
    );
}

export default GeneralSettings;
