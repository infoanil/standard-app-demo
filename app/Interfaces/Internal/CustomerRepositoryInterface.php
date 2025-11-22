<?php

namespace App\Interfaces\Internal;

use App\Models\Customer;

interface CustomerRepositoryInterface
{
    public function getCustomers($shop, $params = []);

    public function getCustomer($shop, $value, $relations = [], $findBy = null);

    public function updateCustomer($shop, Customer $customer, $input = []);
}
