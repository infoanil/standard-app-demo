const isEligible = (shop, featureSlug) => {
    if (shop?.development_store || (shop?.is_trial_active && !shop?.plan_id)) {
        return true;
    }

    if (!shop?.plan_id) {
        return false;
    }

    let plan = shop?.plan;
    if (!plan?.features?.length) return false;

    const matchedFeature = plan.features.find(feature => feature.slug === featureSlug);
    if (!matchedFeature) return false;

    if (matchedFeature.type === 'bool') {
        return matchedFeature?.pivot?.value === true || matchedFeature?.pivot?.value === '1';
    }

    return !!matchedFeature.value;
};

export { isEligible };
