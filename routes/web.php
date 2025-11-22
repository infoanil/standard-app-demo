<?php

use App\Http\Controllers\GeneralController;
use App\Http\Controllers\Internal\ChargeController;
use App\Http\Controllers\Internal\CustomerQueryController;
use Illuminate\Support\Facades\Route;
use Rap2hpoutre\LaravelLogViewer\LogViewerController;
use Osiset\ShopifyApp\Util;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('app');
})->middleware(['verify.shopify'])->name('home');

Route::post('web-vitals', [GeneralController::class, 'createWebVital']);

Route::group(['prefix' => 'general'], function () {
    Route::get('/webhooks', [GeneralController::class, 'getWebhooks']);
    Route::get('/queries_92c64ef1-9c92-4537-852f-6ffa3af057a9', [CustomerQueryController::class, 'index']);
    Route::get('/logs_a4edcca3-6d2e-42e1-980c-e9d8f1d92e90', [LogViewerController::class, 'index']);
});

Route::get('/billing/{plan?}', [ChargeController::class, 'index'])
    ->middleware(['verify.shopify'])
    ->where('plan', '^([0-9]+|)$')
    ->name(Util::getShopifyConfig('route_names.billing'));

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*')->middleware(['verify.shopify']);
