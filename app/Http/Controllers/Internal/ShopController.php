<?php

namespace App\Http\Controllers\Internal;

use App\Interfaces\Internal\ShopRepositoryInterface;
use Illuminate\Http\JsonResponse;

class ShopController
{
    private ShopRepositoryInterface $shopRepository;

    public function __construct(ShopRepositoryInterface $shopRepository) {
        $this->shopRepository = $shopRepository;
    }

    public function auth(): JsonResponse {

        $shop = $this->shopRepository->getAuthShop();

        if ($shop) {
            $shop->load('plan.features');
        }

        return preparedResponse(['shop' => $shop]);
    }
}
