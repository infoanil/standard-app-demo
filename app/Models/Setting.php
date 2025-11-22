<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $guarded = ['id'];

    CONST GROUP_GENERAL = 'general';
    CONST GROUP_EMAIL = 'email';

    /**
     * Get the setting's value.
     */
    protected function value(): Attribute
    {
        return Attribute::make(
            get: function ($value) {

                $valueType = $this->getAttributeValue('value_type');

                return match (strtolower($valueType)) {
                    'number' => (int) $value,
                    'float' => (float) $value,
                    'string' => (string) $value,
                    'boolean' => in_array($value, ['true', '1', true, 1], true),
                    'json', 'array' => isJSON($value) ? json_decode($value, true) : $value,
                    default => $value,
                };
            },
            set: fn ($value) => is_array($value) ? json_encode($value) : $value,
        );
    }
}
