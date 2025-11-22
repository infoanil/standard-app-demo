<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Interfaces\Internal\ApiTokenRepositoryInterface;
use Illuminate\Http\Request;

class ApiTokenController extends Controller
{
    private ApiTokenRepositoryInterface $apiTokenRepository;

    public function __construct(ApiTokenRepositoryInterface $apiTokenRepository) {
        $this->apiTokenRepository = $apiTokenRepository;
    }

    public function store(Request $request)
    {
        return preparedResponse([
            'api_token' => $this->apiTokenRepository->storeApiToken($request->user())
        ]);
    }

    public function show(Request $request)
    {
        return preparedResponse([
            'api_token' => $this->apiTokenRepository->getApiToken($request->user())
        ]);
    }
}
