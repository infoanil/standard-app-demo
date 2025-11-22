<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Class Feature
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property bool $hidden_feature
 * @property string $type
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Feature extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'hidden_feature' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function plans()
    {
        return $this->belongsToMany(Plan::class)
            ->withPivot('value')
            ->withTimestamps();
    }
}
