<?php

namespace App\Interfaces\Internal;

interface SettingRepositoryInterface
{
    public function getSettings($shop);

    public function getGroupSettings($shop, $group);

    public function getSetting($shop, $group, $key);

    public function setSettings($shop, $data = []);
}
