<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class InvitationGroup
 *
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property int $segment_id
 * @property string $status
 * @property bool $is_canceled
 * @property int $total
 * @property int $pending
 * @property int $skipped
 * @property int $successful
 * @property int $free_invites
 * @property int $failed
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Invitation[] $invitations
 */
class InvitationGroup extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_READY = 'READY';
    const STATUS_IN_PROGRESS = 'IN_PROGRESS';
    const STATUS_CANCELED = 'CANCELED';
    const STATUS_COMPLETED = 'COMPLETED';

    protected $guarded = ['id'];

    protected $casts = [
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
        'deleted_at'       => 'datetime',
        'invite_all_group' => 'boolean',
        'customer_fetched' => 'boolean',
        'free_invites'     => 'integer',
    ];

    protected $appends = ['progress'];

    /**
     * Get the invitations associated with the group.
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'invitation_group_id');
    }

    public function getProgressAttribute(): float|int
    {
        return $this->total > 0
            ? (($this->successful + $this->failed + ($this->status === self::STATUS_READY ? 0 : $this->skipped)) / $this->total) * 100
            : 0;
    }

    /**
     * Calculate and update success/failure stats.
     */
    public function updateStats(): void
    {
        $stats = $this->invitations()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $this->pending = $stats[Invitation::STATUS_PENDING] ?? 0;
        $this->successful = $stats[Invitation::STATUS_SENT] ?? 0;
        $this->failed = $stats[Invitation::STATUS_FAILED] ?? 0;
        $this->skipped = $stats[Invitation::STATUS_SKIPPED] ?? 0;
        $this->total = array_sum($stats);

        $this->updateStatus();
        $this->save();
    }

    /**
     * Update the group status based on total, pending, successful, and failed.
     */
    public function updateStatus(): void
    {
        if ($this->pending + $this->skipped === $this->total) {
            $this->status = self::STATUS_READY;
        } else {
            if (($this->successful + $this->failed + $this->skipped) === $this->total) {
                $this->status = self::STATUS_COMPLETED;
            } else {
                $this->status = self::STATUS_IN_PROGRESS;
            }
        }
    }

    public function usageChargeLogs()
    {
        return $this->hasMany(UsageChargeLog::class, 'invitation_group_id');
    }
}
