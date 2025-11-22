import {
    Page,
    Tabs,
} from '@shopify/polaris';
import {useNavigate, useParams} from "react-router-dom";
import {SaveBar, useAppBridge} from '@shopify/app-bridge-react';
import {useEffect, useState} from "react";
import GeneralSettings from "./GeneralSettings";
import EmailSettings from "./EmailSettings";
import ApiSettings from "./ApiSettings";
import {API} from "../../api";

function Settings() {

    const shopify = useAppBridge();
    const navigate = useNavigate();
    const { tab } = useParams();

    const [selected, setSelected] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    const settingFields = {
        general: {
            notification_email: {
                key: 'notification_email',
                value: ''
            },
            multi_pass_token: {
                key: 'multi_pass_token',
                value: ''
            },
        },
        email: {
            sender_email: {
                key: 'sender_email',
                value: ''
            },
            from: {
                key: 'from',
                value: ''
            },
            bcc: {
                key: 'bcc',
                value: ''
            },
            subject: {
                key: 'subject',
                value: ''
            },
            custom_message: {
                key: 'custom_message',
                value: ''
            },
        },
        api: {
            token: {
                key: 'token',
                value: ''
            }
        }
    };
    const [settings, setSettings] = useState(settingFields);
    const [oldSettings, setOldSettings] = useState(settingFields);

    const tabs = [
        {
            id: 'general',
            content: 'General',
            accessibilityLabel: 'General',
            panelID: 'general',
        },
        {
            id: 'email',
            content: 'Email Settings',
            panelID: 'email_settings',
        },
        {
            id: 'api',
            content: 'Api Settings',
            panelID: 'api_settings',
        }
    ];

    const handleTabChange = async (selectedTabIndex) => {
        if (JSON.stringify(settings) !== JSON.stringify(oldSettings)) {
            await shopify?.saveBar?.leaveConfirmation();
            return;
        }

        let selectedTab = tabs[selectedTabIndex] || null;

        if (selectedTab) {
            navigate(selectedTabIndex === 0 ? '/settings' : `/settings/${selectedTab.id}`)
        }
        setSelected(selectedTabIndex);
    }

    const tabComponents = [
        <GeneralSettings settings={settings} setSettings={setSettings} />,
        <EmailSettings settings={settings} setSettings={setSettings} />,
        <ApiSettings settings={settings} setSettings={setSettings} />,
    ];

    const saveSettings = async () => {
        try {
            setSaveLoading(true);
            const response = await API.post('/app/settings', {
                settings: settings
            });

            setOldSettings(JSON.parse(JSON.stringify(settings)));
            shopify?.toast?.show('Settings saved successfully');
            await shopify?.saveBar?.hide('settings-save-bar');

        } catch (e) {
            console.error('Failed to store settings', e)
        } finally {
            setSaveLoading(false);
        }
    }

    const discardSettings = async () => {
        setSettings(JSON.parse(JSON.stringify(oldSettings)));
        await shopify?.saveBar?.hide('settings-save-bar');
    }

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await API.get('/app/settings');

            for (const [group, groupData] of Object.entries(response.data)) {
                for (const [key, setting] of Object.entries(groupData)) {
                    setSettings(prevState => ({
                        ...prevState,
                        [group]: {
                            ...prevState[group],
                            [key]: setting
                        }
                    }))
                    setOldSettings(prevState => ({
                        ...prevState,
                        [group]: {
                            ...prevState[group],
                            [key]: setting
                        }
                    }))
                }
            }
        } catch (e) {
            console.error('Failed to fetch settings', e)
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSettings();

        if (tab) {
            let selectedTab = tabs.findIndex(tabItem => tabItem.id === tab);

            if (selectedTab >= 0) {
                setSelected(selectedTab);
            }
        }
    }, []);

    useEffect(() => {
        if (JSON.stringify(settings) !== JSON.stringify(oldSettings)) {
            shopify?.saveBar?.show('settings-save-bar');
        } else {
            shopify?.saveBar?.hide('settings-save-bar');
        }
    }, [settings]);

    return (
        <Page>
            <SaveBar id="settings-save-bar">
                <button variant="primary" onClick={saveSettings} {...(saveLoading ? { loading: "" } : {})}></button>
                <button onClick={discardSettings}></button>
            </SaveBar>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
                {tabComponents[selected]}
            </Tabs>
        </Page>
    );
}

export default Settings;

