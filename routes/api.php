<?php

use App\Http\Controllers\Api\CustomerController;
use App\Http\Middleware\VerifyApi;
use App\Http\Middleware\VerifyShopifyExtensionApi;
use App\Http\Middleware\VerifyShopifyFlowApi;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::group(['prefix' => 'shopify'], function () {

    Route::group(['prefix' => 'customers', 'middleware' => [VerifyShopifyExtensionApi::class]], function () {

        Route::post('/create-login-url', [CustomerController::class, 'createLoginUrl']);
    });

    Route::group(['prefix' => 'flows', 'middleware' => [VerifyShopifyFlowApi::class]], function () {

        Route::post('/send-invitation', [CustomerController::class, 'sendInvitation']);
    });
});

Route::middleware([VerifyApi::class])->group(function () {

    Route::post('/invite', [CustomerController::class, 'invite']);
});
