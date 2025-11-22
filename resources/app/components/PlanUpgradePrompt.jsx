import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {confirm} from "../store/components/confirm";

const usePlanUpgradePrompt = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return useCallback(async (plan) => {
        let message = 'This feature is not available in your current plan. To unlock this feature, please upgrade your plan to PRO Plan.';
        if (!plan) {
            message = 'You haven\'t selected a plan yet. To access this feature, please choose a plan that suits your business needs. You can also start with the Free Plan, which includes up to 5,000 free invites.';
        }

        const { payload: confirmation } = await dispatch(confirm({
            title: plan ? 'Upgrade required' : 'Select a Plan',
            message,
            options: {
                primaryAction: {
                    content: plan ? 'Upgrade Plan' : 'Select Plan'
                },
                secondaryActions: []
            }
        }));

        if (confirmation) {
            navigate('/plans');
        }
    }, [dispatch, navigate]);
};

export default usePlanUpgradePrompt;
