<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebVital extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'elements' => 'array',
    ];
}
