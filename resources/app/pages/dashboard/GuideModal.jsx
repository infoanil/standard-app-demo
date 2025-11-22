import React, {useCallback, useEffect, useState} from 'react';
import {
    Text,
    Modal,
    BlockStack,
    Banner,
    Tabs,
    Divider,
    List
} from '@shopify/polaris';
import {useNavigate} from "react-router-dom";
import {LockIcon} from '@shopify/polaris-icons';
import {isEligible} from "../../helpers";
import {FEATURES} from "../../constants";

const GuideModal = ({ openGuideModal, setOpenGuideModal, guideModalType, themeUrl, shop }) => {

    const navigate = useNavigate();
    const [selected, setSelected] = useState(0);

    const handleTabChange = useCallback(
        (selectedTabIndex) => setSelected(selectedTabIndex),
        [],
    );

    const tabs = [
        {
            id: 'step-1',
            content: 'Step 1'
        },
        {
            id: 'step-2',
            content: 'Step 2',
        },
        {
            id: 'step-3',
            content: 'Step 3',
        },
    ];

    const frontLoginContent = (
      <>
          <Tabs
              tabs={tabs}
              selected={selected}
              onSelect={handleTabChange}
              disclosureText="More views"
          >
              <>
                  <div style={{marginBottom: '20px'}}>
                      <Divider/>
                  </div>
                  {selected === 0 ?
                      <BlockStack gap="300">
                          <Text as="p">Visit <span onClick={() => navigate('/settings')} style={{cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold'}}>Settings</span> -> Api Settings -> Create and <b>Copy token</b></Text>
                          <img src="/images/guide/settings.webp" alt="api settings" />
                      </BlockStack> : ''}
                  {selected === 1 ?
                      <>
                      <BlockStack gap="300">
                          <Text as="p">Click <b>Open Theme</b> below -> Paste key in <b>Api Token</b> -> <b>Save</b> </Text>
                          <img src="/images/guide/theme-customization.webp" alt="theme_customization" />
                      </BlockStack>
                      <div style={{marginTop: '20px'}}>
                          <Banner tone="warning">
                              <p>Note: These changes will apply to your <b>live theme.</b> You can apply same to <b>unpublished theme</b></p>
                          </Banner>
                      </div>
                      </>: ''}
                  {selected === 2 ?
                      <BlockStack gap="300">
                          <Text as="p">Disabled customers attempting to log in on the storefront will receive an activation invitation.</Text>
                          <img src="/images/guide/account.webp" alt="invitation_group" />
                      </BlockStack> : ''}
              </>
          </Tabs>
          {!isEligible(shop, FEATURES.LOGIN_HELPER) ?
              <div style={{marginTop: '20px'}}>
                  <Banner tone="warning" icon={LockIcon}>
                      <p>To unlock this feature, please upgrade your plan to PRO Plan.</p>
                  </Banner>
              </div>
              : ''
          }
      </>
    );

    const loginHelperContent = (
        <>
            <Tabs
                tabs={tabs}
                selected={selected}
                onSelect={handleTabChange}
                disclosureText="More views"
            >
                <>
                    <div style={{marginBottom: '20px'}}>
                        <Divider/>
                    </div>

                    {selected === 0 ?
                        <BlockStack gap="300">
                            <Text as="p">Visit <span onClick={() => navigate('/settings')} style={{cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold'}}>Settings</span> -> General -> Enter store's <b>Multipass Token</b></Text>
                            <img src="/images/guide/multi-settings.webp" alt="multipass_setting" />
                        </BlockStack> : ''}
                    {selected === 1 ?
                        <BlockStack gap="300">
                            <Text as="p">Click <b>Open Customers</b> below -> Select any customer -> <b>More actions</b> -> <b>Login as customer</b> </Text>
                            <img src="/images/guide/customer-login.webp" alt="customer_login" />
                        </BlockStack> : ''}
                    {selected === 2 ?
                        <BlockStack gap="300">
                            <Text as="p">Afterward, you can log in as the selected customer using this button on the storefront.</Text>
                            <img src="/images/guide/login-success.webp" alt="invitation_group" />
                        </BlockStack> : ''}
                </>
            </Tabs>
            <div style={{marginTop: '20px'}}>
                <Banner tone="warning">
                    <p>This feature is exclusive to the Shopify Plus plan, as Multipass is only available for Plus users. <span onClick={() => window.open('https://shopify.dev/docs/api/multipass')} style={{cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold'}}>Learn more</span></p>
                </Banner>
            </div>
        </>
    );

    const flowInviteContent = (
        <>
            <BlockStack gap="300">
                <List type="number">
                    <List.Item>Visit <b>Apps → Flow → Create workflow</b>. </List.Item>
                    <List.Item>Select a <b>Customer-related trigger</b> (e.g., <i>Customer created</i>).</List.Item>
                    <List.Item>Then choose the action <b>UpSolite: Bulk Invite & Login</b>.</List.Item>
                </List>
                <img src="/images/guide/flow-invite.webp" alt="invitation_group" />
            </BlockStack>
        </>
    );

    const guideConfig = {
        'bulk-invite': {
            title: 'Bulk Invite Guide',
            action: () => navigate('/invitation-groups'),
            content: (
                <BlockStack gap="300">
                    <Text as="p">Visit Invitation groups -> Create group -> Start bulk invitation process</Text>
                    <img src="/images/guide/invitation-group.webp" alt="invitation_group" />
                </BlockStack>
            ),
            buttonLabel: 'Visit Invitation Group'
        },
        'login-helper': {
            title: 'Login Helper Guide',
            action: () => window.open('shopify://admin/customers', '_blank'),
            content: loginHelperContent,
            buttonLabel: 'Visit Customers'
        },
        'front-login': {
            title: 'Front Login Guide',
            action: () => window.open(themeUrl),
            content: frontLoginContent,
            buttonLabel: 'Customize Published Theme',
            disabled: !isEligible(shop, FEATURES.LOGIN_HELPER),
        },
        'flow-invite': {
            title: 'Auto invites via Flow',
            action: () => window.open('shopify://admin/apps/flow/editor', '_blank'),
            content: flowInviteContent,
            buttonLabel: 'Set Up Flow'
        }
    };

    const { title, action, content, buttonLabel, disabled } = guideConfig[guideModalType] || {};

    return (
        <>
            <Modal
                id="app-guide"
                size="large"
                open={openGuideModal}
                onClose={() => setOpenGuideModal(false)}
                title={title}
                primaryAction={{
                    content: buttonLabel,
                    onAction: action,
                    disabled: disabled
                }}
            >
                <Modal.Section>
                    {content}
                </Modal.Section>
            </Modal>
        </>
    );
}

export default GuideModal;
