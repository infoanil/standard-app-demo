<?php

namespace App\Repositories\Internal;

use App\Interfaces\Internal\CustomerRepositoryInterface;
use App\Models\Customer;
use App\Services\ShopifyService;
use Illuminate\Support\Facades\DB;

class CustomerRepository implements CustomerRepositoryInterface
{
    public function getCustomers($shop, $params = [])
    {
        $search = data_get($params, 'search');
        $perPage = data_get($params, 'per_page') ?: 20;
        $all = data_get($params, 'all', false);
        $state = data_get($params, 'state') ?: [];
        $tag = data_get($params, 'tag') ?: '';
        $sortBy = data_get($params, 'sort_by') ?: '';

        $customers = Customer::where('user_id', $shop->id);

        if ($state) {
            $customers = $customers->whereIn('state', $state);
        }

        if ($tag) {
            $customers = $customers->whereJsonContains('tags', $tag);
        }

        if ($search) {
            $customers = $customers->where(function ($query) use ($search) {
                $query->where('first_name', 'LIKE', '%'. $search. '%')
                    ->orWhere('last_name', 'LIKE', '%'. $search. '%')
                    ->orWhere('email', 'LIKE', '%'. $search. '%');
            });
        }

        if ($sortBy) {
            $sortBy = explode(' ', $sortBy);
            if (count($sortBy) === 2) {
                $customers = $customers->orderBy(DB::raw("ISNULL($sortBy[0]), $sortBy[0]"), $sortBy[1]);
            }
        }

        if ($all) {
            return $customers->get();
        }

        return $customers->paginate($perPage);
    }

    public function getCustomer($shop, $value, $relations = [], $findBy = null) {
        $customer = Customer::query();
        if ($relations) {
            $customer = $customer->with($relations);
        }
        $customer = $customer->where('user_id', $shop->id);

        if ($findBy) {
            return $customer->where($findBy, $value)->first();
        }
        return $customer->find($value);
    }

    public function updateCustomer($shop, Customer $customer, $input = [])
    {
        foreach ($input as $key => $value) {
            $customer->{$key} = $value;
        }
        $customer->save();

        return $customer;
    }
}
