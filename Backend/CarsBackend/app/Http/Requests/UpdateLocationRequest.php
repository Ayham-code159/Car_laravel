<?php

namespace App\Http\Requests;

class UpdateLocationRequest extends StoreLocationRequest
{
    protected function requirement(): string
    {
        return 'sometimes';
    }
}
