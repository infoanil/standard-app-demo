import { useEffect } from "react";
import { FidgetSpinner } from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import { reset } from "../store/components/loader";
import {useLocation} from "react-router-dom";

const Loader = () => {

    const dispatch = useDispatch();
    const location = useLocation();
    const active = useSelector(state => state.loaderStore?.active);

    useEffect(() => {
        dispatch(reset());
    }, [location]);

    return (
        <>
            <div className="loader">
                <FidgetSpinner
                    visible={active}
                    height="80"
                    width="80"
                    ariaLabel="dna-loading"
                    wrapperStyle={{}}
                    wrapperClass="dna-wrapper"
                    ballColors={['#ff0000', '#00ff00', '#0000ff']}
                    backgroundColor="#007a5c"
                />
            </div>
        </>
    )
}

export default Loader;
