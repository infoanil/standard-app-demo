<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Osiset\ShopifyApp\Contracts\ShopModel as IShopModel;
use Osiset\ShopifyApp\Objects\Transfers\UsageCharge;
use Osiset\ShopifyApp\Traits\ShopModel;

/**
 * Class ShopifyShop
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $password
 */

class User extends Authenticatable implements IShopModel
{
    use HasFactory, Notifiable, ShopModel;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'development_store',
        'onboarding',
        'last_charge_date',
        'plan_limit_status',
        'trial_ends_at',
        'trial_modal_shown_at',
        'shopify_plus',
        'invite_limit',
        'store_plan_name',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['is_trial_active'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_charge_date' => 'datetime',
            'development_store' => 'boolean',
            'shopify_plus' => 'boolean',
            'trial_ends_at' => 'date',
            'trial_modal_shown_at' => 'date',
        ];
    }

    public function activeCharge()
    {
        return @$this->charges()->where('status', 'active')->first();
    }

    public function invitationGroups()
    {
        return $this->hasMany(InvitationGroup::class);
    }

    public function getIsTrialActiveAttribute()
    {
        return $this->trial_ends_at && (now()->toDateString() <= $this->trial_ends_at);
    }

    public function invitations()
    {
        return $this->hasMany(Invitation::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function settings()
    {
        return $this->hasMany(Setting::class);
    }

    public function usageCharges ()
    {
        return $this->hasMany(UsageCharge::class);
    }
}
