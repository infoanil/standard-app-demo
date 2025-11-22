import {
    Layout,
    Card,
    TextField,
    FormLayout,
    BlockStack,
    Divider,
} from '@shopify/polaris';
import {useEffect} from "react";
import {textFieldValue} from "../../helpers";

function EmailSettings({settings, setSettings}) {

    const group = 'email';

    useEffect(() => {

    }, []);

    return (
        <div style={{marginTop: "8px"}}>
            <BlockStack gap="100">
                <Divider borderColor="border"/>
                <Layout sectioned>
                    <Layout.AnnotatedSection
                        id="email_settings"
                        title="Email Settings"
                        description="Specifies the account invite email fields."
                    >
                        <Card>
                            <FormLayout>
                                <TextField
                                    label="Sender Email"
                                    type="text"
                                    value={textFieldValue(settings[group].sender_email?.value)}
                                    autoComplete="from email"
                                    disabled={true}
                                />
                                <TextField
                                    label="Sender Name"
                                    type="text"
                                    onChange={(value) => setSettings(prevState => ({
                                        ...prevState,
                                        [group]: {
                                            ...prevState[group],
                                            from: {
                                                ...prevState[group].from,
                                                value: value,
                                            },
                                        }
                                    }))}
                                    value={textFieldValue(settings[group].from.value)}
                                    autoComplete="from email"
                                    placeholder="Specifies the email sender name."
                                />
                                <TextField
                                    label="Subject"
                                    onChange={(value) => setSettings(prevState => ({
                                        ...prevState,
                                        [group]: {
                                            ...prevState[group],
                                            subject: {
                                                ...prevState[group].subject,
                                                value: value,
                                            },
                                        }
                                    }))}
                                    value={textFieldValue(settings[group].subject.value)}
                                    autoComplete="off"
                                    placeholder="Specifies the email subject."
                                />
                                <TextField
                                    label="Custom Message"
                                    onChange={(value) => setSettings(prevState => ({
                                        ...prevState,
                                        [group]: {
                                            ...prevState[group],
                                            custom_message: {
                                                ...prevState[group].custom_message,
                                                value: value,
                                            },
                                        }
                                    }))}
                                    value={textFieldValue(settings[group].custom_message.value)}
                                    autoComplete="off"
                                    placeholder="Specifies a custom message to include in the email."
                                />
                            </FormLayout>
                        </Card>
                    </Layout.AnnotatedSection>
                </Layout>
            </BlockStack>
        </div>
    );
}

export default EmailSettings;
