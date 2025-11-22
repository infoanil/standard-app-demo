const customerStatuses = [
    {
        label: 'Invited', value: 'INVITED', tone: "warning"
    },
    {
        label: 'Enabled', value: 'ENABLED', tone: "success"
    },
    {
        label: 'Disabled', value: 'DISABLED', tone: "critical"
    },
];
const invitationGroupStatuses = [
    {
        label: 'Ready to invite', value: 'READY', tone: "info", progress: "incomplete"
    },
    {
        label: 'In progress', value: 'IN_PROGRESS', tone: "attention", progress: "partiallyComplete"
    },
    {
        label: 'Canceled', value: 'CANCELED', tone: "critical", progress: "complete"
    },
    {
        label: 'Completed', value: 'COMPLETED', tone: "success", progress: "complete"
    },
    {
        label: 'Partially Completed', value: 'PARTIALLY_COMPLETED', tone: "warning", progress: "partiallyComplete"
    },
];
const invitationStatuses = [
    {
        label: 'Pending', value: 'PENDING', tone: "attention", progress: "incomplete"
    },
    {
        label: 'Sent', value: 'SENT', tone: "success", progress: "complete"
    },
    {
        label: 'Failed', value: 'FAILED', tone: "critical", progress: "complete"
    },
];

const FEATURES = {
    MULTIPASS_LOGIN: 'multipass-login',
    LOGIN_HELPER: 'login-helper',
    BULK_INVITES: 'bulk-invites',
}

const SOURCES = {
    ADMIN: 'ADMIN',
    FRONTEND: 'FRONTEND',
    FLOW: 'FLOW',
}

export {
    invitationGroupStatuses,
    invitationStatuses,
    customerStatuses,
    FEATURES,
    SOURCES,
}
