import { useEffect } from "react";
import { AppProvider, Frame } from "@shopify/polaris";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchShop } from "../store/features/shops";
import { ErrorBoundary } from "react-error-boundary"
import { AppBridgeRouter, Confirm, ErrorFallback, Loader, Snackbar } from "../components/Index";
import enTranslations from '@shopify/polaris/locales/en.json';

function Main() {

    const dispatch = useDispatch();
    const shopData = useSelector(state => state.shopStore);

    const logError = (error, info) => {
        // Log all errors
    };

    useEffect(() => {
        if (shopData.status === 'idle') {
            dispatch(fetchShop());
        }
    }, [dispatch]);

    return (
        <AppProvider
            i18n={enTranslations}
        >
            <AppBridgeRouter />
            <Frame>
                <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
                    <Confirm />
                    <div className="main">
                        <Outlet />
                    </div>
                    <Loader />
                    <Snackbar />
                </ErrorBoundary>
            </Frame>
        </AppProvider>
    );
}
export default Main;
