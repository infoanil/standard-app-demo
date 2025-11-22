import {
    IndexTable,
    LegacyCard,
    Text,
    Badge, Page, InlineStack, Link, Banner, BlockStack,
} from '@shopify/polaris';
import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import {API} from "../../api";
import Moment from 'react-moment';

function Charges() {
    const navigate = useNavigate();
    const [charges, setCharges] = useState([]);
    const [loading, setLoading] = useState(true);

    const resourceName = {
        singular: 'Charge',
        plural: 'Charges',
    };

    const getCharges = async () => {
        try {
            setLoading(true);
            const response = await API.get('/app/dashboard/usage-charges');
            setCharges(response.data?.groupWithCharge)
        } catch (e) {
            console.error('Failed to fetch plans', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCharges();
    }, []);

    const rowMarkup = charges.map(
        (
            {id, name, amount_charged, charged, pending_charge_amount, charged_at},
            index,
        ) => (
            <IndexTable.Row
                id={id}
                key={id}
                 position={index}
            >
                <IndexTable.Cell>{index+1}</IndexTable.Cell>
                <IndexTable.Cell>{name}</IndexTable.Cell>
                <IndexTable.Cell>{charged}</IndexTable.Cell>
                <IndexTable.Cell>{charged_at ? <Moment format="YYYY/MM/DD">{charged_at}</Moment>: '-' }</IndexTable.Cell>
                <IndexTable.Cell>{amount_charged.toFixed(2)}</IndexTable.Cell>
                <IndexTable.Cell>{pending_charge_amount.toFixed(2)}</IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <Page
            title="Charges"
            backAction={{
                onAction: () => navigate('/')
            }}
        >
            <BlockStack gap="100">
                <LegacyCard>
                    <IndexTable
                        resourceName={resourceName}
                        itemCount={charges.length}
                        headings={[
                            {title: '#'},
                            {title: 'Invitation Group'},
                            {title: 'Invited Customers'},
                            {title: 'Charged At'},
                            {title: 'Amount charged ($)'},
                            {title: 'Pending charge amount ($)'},
                        ]}
                        selectable={false}
                        loading={loading}
                    >
                        {rowMarkup}
                    </IndexTable>
                </LegacyCard>
            </BlockStack>
        </Page>
    );
}

export default Charges;
