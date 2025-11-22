<?php

namespace App\Interfaces\Internal;

use App\Models\User;

interface ApiTokenRepositoryInterface
{
    public function storeApiToken(User $shop);

    public function getApiToken(User $shop);
}
