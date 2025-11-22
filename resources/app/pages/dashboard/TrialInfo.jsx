import {BlockStack, List, Modal, Text} from "@shopify/polaris";
import React from "react";
import {useNavigate} from "react-router-dom";
const TrialInfo = ({ trialModal, setTrialModal, isShopifyPlus }) => {

    const navigate = useNavigate();

    return (
        <Modal
            sectioned={false}
            id="trial-guide-modal"
            open={trialModal}
            onClose={() => setTrialModal(false)}
            title='Trial Period'
            primaryAction={{
                content: 'Select Plan',
                onAction: () => navigate('/plans'),
            }}
        >
            <Modal.Section>
                <BlockStack gap="300">
                    <Text as="h4" variant="headingSm">You’re on Free Trial!</Text>
                    <Text as="p">Explore all premium features and see how UpSolite can streamline your customer login experience. During your trial, you get:</Text>
                    <List type="number">
                        <List.Item>Send Bulk Invitations (up to 100 customers)</List.Item>
                        { isShopifyPlus ? <List.Item>Login as Customer</List.Item> : '' }
                        <List.Item>Frontend Login Helper</List.Item>
                    </List>
                    <Text as="p">Enjoy your trial!</Text>
                    <Text as="p">Upgrade anytime to unlock full limits and keep the momentum going.</Text>
                    <div></div>
                </BlockStack>
            </Modal.Section>
        </Modal>
    )
}

export default TrialInfo;
