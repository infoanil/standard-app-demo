<?php

namespace App\Interfaces\Internal;

use App\Models\User;

interface ShopRepositoryInterface
{
    public function getAuthShop();

    public function getShopByDomain($domain);

    public function updateShop(User $shop, $input = []);

    public function getAndUpdateShop(User $shop);
}
