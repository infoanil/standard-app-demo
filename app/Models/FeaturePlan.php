<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Class FeaturePlan
 *
 * @property int $id
 * @property int $plan_id
 * @property int $feature_id
 * @property string|bool|int|null $value
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class FeaturePlan extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'value' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
