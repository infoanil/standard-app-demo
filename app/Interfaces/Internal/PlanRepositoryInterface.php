<?php

namespace App\Interfaces\Internal;

interface PlanRepositoryInterface
{
    public function getPlans($shop);

    public function getPlan($shop, $planId);
}
