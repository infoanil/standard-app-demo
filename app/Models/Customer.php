<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    const GRAPHQL_ID = 'graphql_id';
    const EMAIL = 'email';

    const STATE_INVITED = 'INVITED';
    const STATE_ENABLED = 'ENABLED';
    const STATE_DISABLED = 'DISABLED';
    const STATE_DECLINED = 'DECLINED';

    protected $guarded = ['id'];

    protected $casts = [
        'tags' => 'json'
    ];
}
