<?php

namespace App\Http\Middleware;

use App\Repositories\Internal\ShopRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyShopifyExtensionApi
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $token = $request->header('X-Shopify-Token');

            [$header, $payload, $signature] = explode('.', $token);

            $data = $header . '.' . $payload;
            $validSignature = hash_hmac('sha256', $data, env('SHOPIFY_API_SECRET'), true);
            $validSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));

            $isValid = hash_equals($validSignature, $signature);

            if (!$isValid) {
                return preparedResponse('Unauthenticated request', 401, true);
            }

            $payload = json_decode(base64_decode($payload), true);

            $shop = data_get($payload, 'dest');
            $shop = parse_url($shop, PHP_URL_HOST);

            $shop = (new ShopRepository())->getShopByDomain($shop);

            if (!$shop) {
                return preparedResponse('Unauthenticated request', 401, true);
            }

            $request->attributes->add(['shop' => $shop]);

        } catch (\Exception $e) {
            return preparedResponse('Unauthenticated request', 401, true);
        }

        return $next($request);
    }
}
