<?php

namespace App\Repositories\Internal;

use App\Interfaces\Internal\FeatureRepositoryInterface;
use App\Models\Feature;

class FeatureRepository implements FeatureRepositoryInterface
{
    public function getFeatures(): \Illuminate\Database\Eloquent\Collection
    {
        return Feature::all();
    }
}
