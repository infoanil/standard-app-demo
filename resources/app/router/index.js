import { createBrowserRouter } from "react-router-dom";

import Main from "../layouts/Main";
import App from "../layouts/App";
import Dashboard from "../pages/dashboard/Dashboard";
import Settings from "../pages/settings/Settings";
import { PageNotFound } from "../components/Index";
import Customers from "../pages/customers/Customers";
import Charges from "../pages/Charges/Index";
import InvitationGroups from "../pages/invitation_groups/InvitationGroups";
import InvitationGroup from "../pages/invitation_groups/InvitationGroup";
import InvitationGroupCreate from "../pages/invitation_groups/InvitationGroupCreate";
import Plans from "../pages/plans/Plans";

const routes = [
    {
        path: '/',
        element: <Main />,
        children: [
            {
                path: '',
                element: <App />,
                children: [
                    {
                        path: '',
                        element: <Dashboard />
                    },
                    {
                        path: 'customers',
                        element: <Customers />
                    },
                    {
                        path: 'charges',
                        element: <Charges />
                    },
                    {
                        path: 'invitation-groups',
                        element: <InvitationGroups />,
                    },
                    {
                        path: 'invitation-groups/create',
                        element: <InvitationGroupCreate />
                    },
                    {
                        path: 'invitation-groups/:invitationGroupId',
                        element: <InvitationGroup />
                    },
                    {
                        path: 'settings',
                        element: <Settings />,
                    },
                    {
                        path: 'settings/:tab',
                        element: <Settings />,
                    },
                    {
                        path: 'plans',
                        element: <Plans />,
                    },
                ]
            },
            {
                path: '/*',
                element: <PageNotFound />
            }
        ]
    },
];

const router = createBrowserRouter(routes);

export { router, routes };
