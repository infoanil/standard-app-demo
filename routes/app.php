<?php

use App\Http\Controllers\Internal\ApiTokenController;
use App\Http\Controllers\Internal\ChargeController;
use App\Http\Controllers\Internal\CustomerController;
use App\Http\Controllers\Internal\CustomerQueryController;
use App\Http\Controllers\Internal\DashboardController;
use App\Http\Controllers\Internal\InvitationController;
use App\Http\Controllers\Internal\InvitationGroupController;
use App\Http\Controllers\Internal\PlanController;
use App\Http\Controllers\Internal\SegmentController;
use App\Http\Controllers\Internal\SettingController;
use App\Http\Controllers\Internal\ShopController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'shops'], function () {
    Route::get('/auth', [ShopController::class, 'auth']);
});

Route::group(['prefix' => 'customers'], function () {
    Route::get('/', [CustomerController::class, 'index']);
    Route::post('/sync', [CustomerController::class, 'syncCustomers']);
    Route::post('/bulk-invite', [CustomerController::class, 'bulkInvite']);
    Route::get('/segment', [CustomerController::class, 'segmentCustomers']);
    Route::get('/bulkOperation-status', [CustomerController::class, 'customerBulkOperationStatus']);

    Route::group(['prefix' => '{customerId}'], function () {
        Route::post('/invite', [CustomerController::class, 'invite']);
        Route::post('/create-invitation-url', [CustomerController::class, 'createInvitationUrl']);
        Route::post('/create-login-url', [CustomerController::class, 'createLoginUrl']);
    });
});

Route::group(['prefix' => 'dashboard'], function () {
    Route::get('/', [DashboardController::class, 'index']);
    Route::post('/invite-all', [InvitationGroupController::class, 'createSegmentAndInvite']);
    Route::post('/customer-queries', [CustomerQueryController::class, 'store']);
    Route::get('/usage-charges', [DashboardController::class, 'usageCharges']);
    Route::get('/onboard', [DashboardController::class, 'onboard']);
    Route::get('/activities', [DashboardController::class, 'activities']);
});

Route::group(['prefix' => 'invitation-groups'], function () {
    Route::get('/', [InvitationGroupController::class, 'index']);
    Route::post('/', [InvitationGroupController::class, 'store']);
    Route::group(['prefix' => '{invitationGroupId}'], function () {
        Route::get('/', [InvitationGroupController::class, 'show']);
        Route::put('/', [InvitationGroupController::class, 'update']);
        Route::delete('/', [InvitationGroupController::class, 'destroy']);
        Route::post('/process', [InvitationGroupController::class, 'process']);
        Route::post('/cancel', [InvitationGroupController::class, 'cancel']);
        Route::post('/export', [InvitationGroupController::class, 'export']);
        Route::get('/invite-cost', [InvitationGroupController::class, 'calculateGroupCost']);

        Route::group(['prefix' => 'invitations'], function () {
            Route::get('/', [InvitationController::class, 'index']);
            Route::group(['prefix' => '{invitationId}'], function () {
                Route::post('/invite', [InvitationController::class, 'invite']);
            });
        });
    });
});

Route::get('/invite-cost', [DashboardController::class, 'calculateInviteCost']);

Route::group(['prefix' => 'segments'], function () {
    Route::get('/', [SegmentController::class, 'index']);
});

Route::group(['prefix' => 'api-tokens'], function () {
    Route::get('/', [ApiTokenController::class, 'show']);
    Route::post('/', [ApiTokenController::class, 'store']);
});

Route::group(['prefix' => 'settings'], function () {
    Route::get('/', [SettingController::class, 'index']);
    Route::post('/', [SettingController::class, 'store']);
    Route::get('{group}/{key}', [SettingController::class, 'show']);
});

Route::group(['prefix' => 'plans'], function () {
    Route::get('/', [PlanController::class, 'index']);
    Route::get('/onboard', [PlanController::class, 'completeOnboard']);
});
