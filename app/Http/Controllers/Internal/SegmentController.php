<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Services\ShopifyService;
use Illuminate\Http\Request;

class SegmentController extends Controller
{
    public function index(Request $request)
    {
        $shopifyService = new ShopifyService($request->user());
        return preparedResponse(['segments' => $shopifyService->getSegments()]);
    }
}
