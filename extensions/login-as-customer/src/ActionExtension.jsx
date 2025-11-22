import {useEffect, useState} from 'react';
import {
    reactExtension,
    useApi,
    AdminAction,
    Button,
    Text,
    Banner
} from '@shopify/ui-extensions-react/admin';
import {Paragraph} from "@shopify/ui-extensions/admin";

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = 'admin.customer-details.action.render';

export default reactExtension(TARGET, () => <App />);

function App() {
    // The useApi hook provides access to several useful APIs like i18n, close, and data.

    const {i18n, close, data, auth} = useApi(TARGET);
    const [customer, setCustomer] = useState({});
    const [error, setError] = useState('');

    // Use direct API calls to fetch data from Shopify.
    // See https://shopify.dev/docs/api/admin-graphql for more information about Shopify's GraphQL API

    const handleGetLoginUrl = async () => {
        let customerId = data.selected[0] || {};
        customerId = customerId.id ? customerId.id : null;

        if (!customerId) {
            console.error('Customer not found');
            return;
        }

        try {
            let token = await auth.idToken();

            let response = await fetch('/api/shopify/customers/create-login-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Token': token
                },
                body: JSON.stringify({
                    id: customerId
                })
            });

            let apiFailed = !response.ok;
            response = await response.json();

            if (apiFailed) {
                setError(response.message ? response.message : 'Unable to create customer login url');
                return;
            }

            if (!response?.customer) {
                setError('Unable to create customer login url');
                return;
            }

            setCustomer(response.customer);

        } catch (e) {
            console.error(e);
            setError('Unable to create customer login url');
        }
    }

    useEffect(() => {
        handleGetLoginUrl();
    }, [data.selected]);

    return (
        // The AdminAction component provides an API for setting the title and actions of the Action extension wrapper.
        <>
            {
                ((customer && customer.id) || error) &&
                <AdminAction
                    primaryAction={
                        <Button
                            to={customer.login_url}
                            disabled={!customer.login_url}
                            onPress={() => close()}
                        >
                            Login
                        </Button>
                    }
                    secondaryAction={
                        <Button
                            onPress={() => close()}
                        >
                            Close
                        </Button>
                    }
                >
                    {
                        error ?
                        <Banner title="Error occured" tone="critical">
                            <Paragraph>{error}</Paragraph>
                        </Banner>
                        : <Text>
                                You will be logged in for customer <Text fontWeight="bold">{customer.email}</Text>
                        </Text>
                    }
                </AdminAction>
            }
        </>
    );
}
