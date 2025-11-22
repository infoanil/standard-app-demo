<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BulkOperation extends Model
{
    protected $guarded = ['id'];

    const TYPE_CUSTOMERS = 'customers';

    const STATUS_CREATED = 'CREATED';
    const STATUS_RUNNING = 'RUNNING';
    const STATUS_FAILED = 'FAILED';
    const STATUS_COMPLETED = 'COMPLETED';
    const STATUS_CANCELED = 'CANCELED';
    const STATUS_EXPIRED = 'EXPIRED';
}
