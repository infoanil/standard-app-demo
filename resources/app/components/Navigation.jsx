import { NavMenu } from "@shopify/app-bridge-react";
import {useLocation} from "react-router-dom";

const Navigation = (props) => {

    const location = useLocation();

    const DASHBOARD = '/';
    const CUSTOMERS = '/customers';
    const SETTINGS = '/settings';
    const INVITATION_GROUPS = '/invitation-groups';
    const PLANS = '/plans';

    const navigation = [
        {
            label: 'home',
            destination: DASHBOARD,
        },
        {
            label: 'Customers',
            destination: CUSTOMERS,
        },
        {
            label: 'Invitation Groups',
            destination: INVITATION_GROUPS,
        },
        {
            label: 'Settings',
            destination: SETTINGS,
        },
        {
            label: 'Plans',
            destination: PLANS,
        },
    ];

    return (
        <NavMenu key={location.pathname}>
            {navigation.map((navItem, navIndex) => (
                <a key={navIndex} href={navItem.destination} rel={navItem.label}>
                    {navItem.label}
                </a>
            ))}
        </NavMenu>
    );
};

export default Navigation;
