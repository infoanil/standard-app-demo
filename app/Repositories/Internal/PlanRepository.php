<?php

namespace App\Repositories\Internal;

use App\Interfaces\Internal\PlanRepositoryInterface;
use App\Interfaces\Internal\FeatureRepositoryInterface;
use App\Models\Plan;
use Illuminate\Support\Facades\Cache;

class PlanRepository implements PlanRepositoryInterface
{
    private FeatureRepositoryInterface $featureRepository;

    public function __construct(FeatureRepositoryInterface $featureRepository)
    {
        $this->featureRepository = $featureRepository;
    }

    public function getPlans($shop): array
    {
        $cacheDuration = 60 * 60; // 1 hour cache, adjust as needed

        // Cache normalized public plans globally
        $normalizedPlans = Cache::remember('plans.public.normalized', $cacheDuration, function () {
            $publicPlans = Plan::where('public', true)->with('features')->get();
            $allFeatures = $this->featureRepository->getFeatures();

            return $publicPlans->map(function ($plan) use ($allFeatures) {
                $features = $allFeatures->map(function ($feature) use ($plan) {
                    $matched = $plan->features->firstWhere('id', $feature->id);
                    return [
                        'id' => $feature->id,
                        'name' => $feature->name,
                        'slug' => $feature->slug,
                        'type' => $feature->type,
                        'display_order' => $feature->display_order,
                        'value' => $matched ? $matched->pivot->value : null,
                    ];
                });

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'capped_amount' => $plan->capped_amount,
                    'trial_days' => $plan->trial_days,
                    'discount' => $plan->discount,
                    'invite_limit' => $plan->invite_limit,
                    'features' => $features->toArray(),
                ];
            });
        });

        // Cache assigned plan per shop (if any)
        $assignedPlan = null;
        if ($shop->plan_id) {
            $assignedPlan = Cache::remember("plans.assigned.{$shop->plan_id}", $cacheDuration, function () use ($shop) {
                $assigned = Plan::where('id', $shop->plan_id)->with('features')->first();
                if (!$assigned) {
                    return null;
                }
                $allFeatures = $this->featureRepository->getFeatures();

                return [
                    'id' => $assigned->id,
                    'name' => $assigned->name,
                    'slug' => $assigned->slug,
                    'description' => $assigned->description,
                    'price' => $assigned->price,
                    'capped_amount' => $assigned->capped_amount,
                    'trial_days' => $assigned->trial_days,
                    'discount' => $assigned->discount,
                    'invite_limit' => $assigned->invite_limit,
                    'features' => $allFeatures->map(function ($feature) use ($assigned) {
                        $matched = $assigned->features->firstWhere('id', $feature->id);
                        return [
                            'id' => $feature->id,
                            'name' => $feature->name,
                            'type' => $feature->type,
                            'slug' => $feature->slug,
                            'display_order' => $feature->display_order,
                            'value' => $matched ? $matched->pivot->value : null,
                        ];
                    })->toArray(),
                ];
            });
        }

        return [
            'plans' => $normalizedPlans->toArray(),
            'plan' => $assignedPlan,
        ];
    }

    public function getPlan($shop, $planId = null): ?array
    {
        $allFeatures = $this->featureRepository->getFeatures();
        $plan = null;

        if ($planId) {
            $plan = Plan::where('id', $planId)->with('features')->first();
        } elseif ($shop->plan_id) {
            $plan = Plan::where('id', $shop->plan_id)->with('features')->first();
        }

        if (!$plan) {
            return null;
        }

        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'price' => $plan->price,
            'capped_amount' => $plan->capped_amount,
            'trial_days' => $plan->trial_days,
            'features' => $allFeatures->map(function ($feature) use ($plan) {
                $matched = $plan->features->firstWhere('id', $feature->id);
                return [
                    'id' => $feature->id,
                    'name' => $feature->name,
                    'type' => $feature->type,
                    'value' => $matched ? $matched->pivot->value : null,
                ];
            })->toArray(),
        ];
    }
}
