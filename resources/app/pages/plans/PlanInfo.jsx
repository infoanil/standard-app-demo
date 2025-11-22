import {BlockStack, DataTable, Modal, Text} from "@shopify/polaris";
import React from "react";
const PlanInfo = ({ infoModal, setInfoModal, }) => {

    const rows = [
        ['Free', 'Up to 5,000 invites', '—'],
        ['Pro', 'Up to 5,000 invites', '$0.001 per invite after 5,000'],
    ];

    return (
        <Modal
            id="invitation-create-start"
            sectioned
            open={infoModal}
            onClose={() => setInfoModal(false)}
            title="Invitation pricing"
        >
            <Modal.Section>
                <BlockStack gap="300">
                    <Text as="h6">
                        Here’s exactly how billing works for invitation sends:
                    </Text>

                    <DataTable
                        columnContentTypes={['text', 'text', 'text']}
                        headings={['Plan', 'Included free invites', 'Overage rate']}
                        rows={rows}
                    />
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
}

export default PlanInfo;
