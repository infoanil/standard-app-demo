<?php

namespace App\Http\Middleware;

use App\Repositories\Internal\ShopRepository;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Symfony\Component\HttpFoundation\Response;

class VerifyShopifyFlowApi
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $hmac = $request->header('x-shopify-hmac-sha256', '');

        $data = $request->getContent();
        $hmacLocal = $this->createHmac(
            [
                'data' => $data,
                'raw' => true,
                'encode' => true,
            ],
            env('SHOPIFY_API_SECRET')
        );

        if (!hash_equals($hmacLocal, $hmac)) {
            // Issue with HMAC or missing shop header
            return \Illuminate\Support\Facades\Response::make('Invalid flow signature.', HttpResponse::HTTP_UNAUTHORIZED);
        }

        $shop = data_get($request->all(), 'shopify_domain');

        $shop = (new ShopRepository())->getShopByDomain($shop);

        if (!$shop) {
            return preparedResponse('Unauthenticated request', 401, true);
        }

        $request->attributes->add(['shop' => $shop]);

        // All good, process flow request
        return $next($request);
    }

    public function createHmac(array $opts, string $secret)
    {
        // Setup defaults
        $data = $opts['data'];
        $raw = $opts['raw'] ?? false;
        $buildQuery = $opts['buildQuery'] ?? false;
        $buildQueryWithJoin = $opts['buildQueryWithJoin'] ?? false;
        $encode = $opts['encode'] ?? false;

        if ($buildQuery) {
            //Query params must be sorted and compiled
            ksort($data);
            $queryCompiled = [];
            foreach ($data as $key => $value) {
                $queryCompiled[] = "{$key}=".(is_array($value) ? implode(',', $value) : $value);
            }
            $data = implode(
                $buildQueryWithJoin ? '&' : '',
                $queryCompiled
            );
        }

        // Create the hmac all based on the secret
        $hmac = hash_hmac('sha256', $data, $secret, $raw);

        return $encode ? base64_encode($hmac) : $hmac;
    }
}
