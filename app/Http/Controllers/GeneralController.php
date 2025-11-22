<?php

namespace App\Http\Controllers;

use App\Models\WebVital;
use Illuminate\Http\Request;

class GeneralController extends Controller
{
    function getWebhooks(Request $request)
    {
        $shopId = $request->query('shop_id');
        $shop = \App\Models\User::find($shopId);
        if (!$shop) {
            return response()->json(['error' => 'Shop not found'], 404);
        }

        try {
            $response = $shop->api()->rest('GET', '/admin/api/2025-01/webhooks.json');

            if ($response['errors']) {
                return response()->json(['error' => $response['body']], 400);
            }

            return response()->json($response['body']['webhooks']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    function createWebVital(Request $request)
    {
        $data = json_decode($request->getContent(), true);

        foreach ($data['metrics'] as $metric) {

            WebVital::create(
                [
                    'shop' => $data['shop'],
                    'path' => $data['path'],
                    'name' => $metric['name'],
                    'value' => $metric['value'],
                    'delta' => $metric['delta'],
                    'elements' => $metric['elements'] ?? null,
                ],
            );
        }
    }
}
