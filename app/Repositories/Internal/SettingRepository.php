<?php

namespace App\Repositories\Internal;

use App\Interfaces\Internal\SettingRepositoryInterface;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class SettingRepository implements SettingRepositoryInterface
{
    public function getSettings($shop) {
        return Setting::where('user_id', $shop->id)->get()
            ->groupBy('group')->map(function ($group) {
                return $group->keyBy('key');
            });
    }

    public function getGroupSettings($shop, $group) {
        $settings = Setting::where('user_id', $shop->id)->where('group', $group)->get()
            ->groupBy('group')->map(function ($group) {
                return $group->keyBy('key');
            });

        return data_get($settings, $group) ?: [];
    }

    public function getSetting($shop, $group, $key) {
        return Setting::where('user_id', $shop->id)
            ->where('group', $group)
            ->where('key', $key)->first();
    }

    public function setSettings($shop, $data = [])
    {
        $settings = Setting::where('user_id', $shop->id)->get()
            ->groupBy('group')->map(function ($group) {
                return $group->keyBy('key');
            });

        DB::transaction(function () use ($shop, $settings, $data) {

            $updateSettings = [];
            $createSettings = [];

            foreach ($data ?: [] as $group => $groupData) {
                foreach ($groupData as $datum) {
                    $key = data_get($datum, 'key');
                    $value = data_get($datum, 'value');

                    if (empty($key)) {
                        continue;
                    }

                    $tempSetting = [
                        'user_id' => $shop->id,
                        'group' => $group,
                        'key' => $key,
                        'value' => is_array($value) ? json_encode($value) : $value,
                        'value_type' => gettype($value),
                        'updated_at' => now(),
                    ];

                    if (empty(data_get($settings, "$group.$key"))) {
                        $tempSetting['created_at'] = now();
                        $createSettings[] = $tempSetting;
                    } else {
                        $isUpdated = false;
                        if (is_array($value) || is_object($value)) {
                            if (json_encode(data_get($settings, "$group.$key.value")) !== json_encode($value)) {
                                $isUpdated = true;
                            }
                        } else if (data_get($settings, "$group.$key.value") !== $value) {
                            $isUpdated = true;
                        }

                        if ($isUpdated) {
                            $tempSetting['id'] = data_get($settings, "$group.$key.id");
                            $updateSettings[] = $tempSetting;
                        }
                    }
                }
            }

            if (!empty($createSettings)) {
                Setting::insert($createSettings);
            }

            if (!empty($updateSettings)) {
                bulkUpdate('settings', $updateSettings);
            }
        });
    }
}
