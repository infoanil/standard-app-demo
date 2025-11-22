<?php

namespace App\Exceptions;

use Exception;

class ShopifyApiException extends Exception
{
    protected array $context;

    public function __construct(string $message, int $code = 500, array $context = [])
    {
        parent::__construct($message, $code);
        $this->context = $context;
    }

    public function getContext(): array
    {
        return $this->context;
    }
}
