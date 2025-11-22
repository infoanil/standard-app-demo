<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Route;
use Osiset\ShopifyApp\Exceptions\MissingShopDomainException;
use Osiset\ShopifyApp\Exceptions\SignatureVerificationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {

            Route::middleware('api')
                ->prefix('api')
                ->name('api.')
                ->group(base_path('routes/api.php'));

            Route::middleware(['proxy', 'auth.proxy'])
                ->prefix('proxy')
                ->name('proxy.')
                ->group(base_path('routes/proxy.php'));

            Route::middleware(['app', 'verify.shopify'])
                ->prefix('app')
                ->name('app.')
                ->group(base_path('routes/app.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->validateCsrfTokens(except: [
            'web-vitals',
        ]);

        $middleware->appendToGroup('app', [
            SubstituteBindings::class,
        ]);

        $middleware->appendToGroup('proxy', [
            ThrottleRequests::class.':60,1',
            SubstituteBindings::class,
        ]);

        $middleware->group('api', [
            ThrottleRequests::class.':60,1',
            SubstituteBindings::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontReport([
            MissingShopDomainException::class,
            SignatureVerificationException::class,
        ]);
    })->create();
