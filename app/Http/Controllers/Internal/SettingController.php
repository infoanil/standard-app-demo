<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Interfaces\Internal\SettingRepositoryInterface;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private SettingRepositoryInterface $settingRepository;

    public function __construct(SettingRepositoryInterface $settingRepository) {
        $this->settingRepository = $settingRepository;
    }

    public function index(Request $request) {
        return $this->settingRepository->getSettings($request->user());
    }

    public function show(Request $request, $group, $key) {
        return $this->settingRepository->getSetting($request->user(), $group, $key);
    }

    public function store(Request $request) {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.*' => 'required|array',
            'settings.*.*.key' => 'required',
        ]);

        $this->settingRepository->setSettings($request->user(), $request->input('settings'));

        return response(['message' => 'Settings saved successfully']);
    }
}
