import {isEligible} from "./feature-manager";

const isEmptyValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return true;
    } else if (Array.isArray(value)) {
        return value.length === 0;
    } else if (typeof value === 'object') {
        return value && Object.keys(value).length === 0;
    }

    return false;
}

const textFieldValue = (value) => {
    return isEmptyValue(value) ? '' : value;
}

export {
    isEmptyValue,
    textFieldValue,
    isEligible
}
