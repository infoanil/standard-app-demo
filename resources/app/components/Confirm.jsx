import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { agree, close, reset } from "../store/components/confirm";
import { useLocation } from "react-router-dom";
import { Text } from "@shopify/polaris";
import {Modal, TitleBar, useAppBridge} from "@shopify/app-bridge-react";

const Confirm = (props) => {

    const dispatch = useDispatch();
    const shopify = useAppBridge();
    const location = useLocation();

    const confirmProps = useSelector((state) => state.confirmStore);
    const { id, active, title, message, options = {} } = confirmProps;

    useEffect(() => {
        dispatch(reset());
    }, [location]);

    useEffect(() => {
        if (active) {
            shopify.modal?.show(id);
        } else {
            shopify.modal?.hide(id);
        }
    }, [active]);

    return (
        <>
            <Modal
                open={active}
                id={id}
                onHide={() => dispatch(close())}
            >
                <div style={{padding: '12px'}}>
                    <Text as="p">
                        {message}
                    </Text>
                </div>

                <TitleBar title={title}>
                    <button
                        variant="primary"
                        tone={options.primaryAction.tone}
                        {...(options.primaryAction.loading ? { loading: "" } : {})}
                        disabled={options.primaryAction.disabled}
                        onClick={() => dispatch(agree())}
                    >
                        {options.primaryAction && options.primaryAction.content ? options.primaryAction.content : 'Yes'}
                    </button>
                    {options.secondaryActions.map((secondaryAction, secondaryActionIndex) => {
                        return <button
                            key={secondaryActionIndex}
                            tone={secondaryAction.tone}
                            {...(secondaryAction.loading ? { loading: "" } : {})}
                            disabled={secondaryAction.disabled}
                            onClick={() => dispatch(close())}
                        >
                            {secondaryAction.content ? secondaryAction.content : 'No'}
                        </button>
                    })}
                </TitleBar>
            </Modal>
        </>
    );
}
export default Confirm;
