<?php

namespace App\Http\Middleware;

use App\Repositories\Internal\ApiTokenRepository;
use App\Repositories\Internal\ShopRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyApi
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = $request->header('X-Nonce');
        $token = $request->header('X-Api-Token');
        $fingerprint = base64_encode($request->userAgent());

        if (!$token) {
            return preparedResponse('Unauthenticated request', 401, true);
        }

        try {
            [$payload, $signature] = explode('||', base64_decode($token));

            if ($signature !== hash_hmac('sha256', $payload, env('APP_KEY'))) {
                return preparedResponse('Unauthenticated request', 401, true);
            }

            $data = json_decode($payload, true);

            $shop = data_get($data, 'shop');

            $timestamp = now()->timestamp;
            $nonceMatched = false;

            try {
                for ($i = 0; $i < 5; $i++) {
                    $tempTimestamp = $timestamp - $i;

                    $serverNonce = $this->createNonce("$fingerprint-$shop", $tempTimestamp);

                    if ($serverNonce === $nonce) {
                        $nonceMatched = true;
                        break;
                    }
                }
            } catch (\Exception $e) {
                return preparedResponse('Unauthenticated request', 401, true);
            }

            if (!$nonceMatched) {
                return preparedResponse('Unauthenticated request', 401, true);
            }

            $shop = (new ShopRepository())->getShopByDomain($shop);

            $apiToken = (new ApiTokenRepository())->getApiToken($shop);

            if (!($apiToken && data_get($apiToken, 'token') === $token) || !$shop) {
                return preparedResponse('Unauthenticated request', 401, true);
            }

            $request->attributes->add(['shop' => $shop]);

        } catch (\Exception $e) {
            return preparedResponse('Unauthenticated request', 401, true);
        }

        return $next($request);
    }

    private function createNonce($text, $key)
    {
        $key = str($key)->toString();
        $encrypted = '';
        for ($i = 0; $i < strlen($text); $i++) {
            $encrypted .= chr(ord($text[$i]) ^ ord($key[$i % strlen($key)]));
        }
        return base64_encode($encrypted);
    }
}
