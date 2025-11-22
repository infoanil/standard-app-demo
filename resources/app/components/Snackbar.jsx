import { useEffect } from "react";
import { Toast } from "@shopify/polaris"
import { useDispatch, useSelector } from "react-redux";
import { close } from "../store/components/toast";
import { useLocation } from "react-router-dom";
import { reset } from "../store/components/toast";

const Snackbar = (props) => {

    const dispatch = useDispatch();
    const location = useLocation();
    const toastProps = useSelector((state) => state.toastStore);
    const { active, content, error, duration } = toastProps;

    useEffect(() => {
        dispatch(reset());
    }, [location]);

    return (
        <>
            {active && <Toast
                content={content}
                error={error}
                duration={duration}
                onDismiss={() => dispatch(close())}
            />}
        </>
    );
}
export default Snackbar;
