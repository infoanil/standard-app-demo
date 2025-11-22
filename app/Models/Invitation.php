<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class InvitationGroup
 *
 * @property int $id
 * @property int $user_id
 * @property int invitation_group_id
 * @property int|null $customer_id
 * @property string $email
 * @property string|null $customer_name
 * @property string $customer_state (ENABLED, DISABLED, INVITED)
 * @property int $status (0 = PENDING, 1 = SENT, 2 = FAILED)
 * @property string|null $error_message
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property Carbon|null $deleted_at
 * @property InvitationGroup $invitationGroup
 */
class Invitation extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'PENDING';
    const STATUS_SENT = 'SENT';
    const STATUS_FAILED = 'FAILED';
    const STATUS_SKIPPED = 'SKIPPED';

    const SOURCE_ADMIN = 'ADMIN';
    const SOURCE_FRONTEND = 'FRONTEND';
    const SOURCE_FLOW = 'FLOW';

    protected $guarded = ['id'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'charged'    => 'boolean',
    ];

    /**
     * Get the invitation group that this invitation belongs to.
     */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(InvitationGroup::class, 'invitation_group_id');
    }
}
