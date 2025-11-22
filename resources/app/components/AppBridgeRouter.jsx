import { useLocation, useSearchParams } from "react-router-dom";

const AppBridgeRouter = () => {

    const location = useLocation();
    const [searchParams] = useSearchParams();

    const prepareCustomUrl = () => {
        let ignoreParameters = ['appLoadId', 'embedded', 'host', 'shop', 'token'];
        ignoreParameters.forEach((parameter) => {
            searchParams.delete(parameter);
        });

        let queryString = searchParams.toString();
        queryString = queryString && queryString.length ? queryString : null;
        return queryString ? `${location.pathname}?${queryString}` : location.pathname;
    }

    return null;
}

export default AppBridgeRouter;

