<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsageChargeLog extends Model
{
    protected $fillable = [
        'user_id',
        'invitation_group_id',
        'successful_invites',
        'amount_charged',
        'notes',
        'charged_at',
        'charge_id',
        'error',
    ];

    protected $casts = [
        'successful_invites' => 'integer',
        'charged_at'         => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invitationGroup(): BelongsTo
    {
        return $this->belongsTo(InvitationGroup::class);
    }
}

