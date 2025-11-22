<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Carbon;
use Osiset\ShopifyApp\Storage\Models\Plan as BasePlan;

/**
 * Class Plan
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property bool $public
 * @property float $price
 * @property float|null $capped_amount
 * @property int|null $trial_days
 * @property bool $test
 * @property bool $on_install
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Plan extends BasePlan
{
    use HasFactory;

    protected $table = 'plans';

    protected $guarded = ['id'];

    CONST FREE_PLAN = 'bulk-invite';

    CONST PRO_PLAN = 'pro';

    protected $casts = [
        'test' => 'bool',
        'on_install' => 'bool',
        'capped_amount' => 'float',
        'price' => 'float',
        'public' => 'bool',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'discount' => 'json',
    ];

    public function features()
    {
        return $this->belongsToMany(Feature::class)
            ->withPivot('value')
            ->withTimestamps();
    }
}
