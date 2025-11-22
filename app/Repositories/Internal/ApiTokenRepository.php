<?php

namespace App\Repositories\Internal;

use App\Interfaces\Internal\ApiTokenRepositoryInterface;
use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class ApiTokenRepository implements ApiTokenRepositoryInterface
{
    public function storeApiToken(User $shop)
    {
        $authToken = ApiToken::where('user_id', $shop->id)->first();

        $payload = json_encode([
            'shop' => $shop->name,
            'hash' => str()->uuid()
        ]);

        $token = base64_encode($payload . '||' . hash_hmac('sha256', $payload, env('APP_KEY')));

        if (!$authToken) {
            $authToken = new ApiToken();
            $authToken->user_id = $shop->id;
        }
        $authToken->token = $token;

        $authToken->save();

        if (Cache::get("api_token_$shop->name")) {
            Cache::remember("api_token_$shop->name", 3600, function () use ($authToken) {
                return $authToken;
            });
        }

        return $authToken;
    }

    public function getApiToken(User $shop)
    {
        return Cache::remember("api_token_$shop->name", 3600, function () use ($shop) {
            return ApiToken::where('user_id', $shop->id)->first();
        });
    }
}
