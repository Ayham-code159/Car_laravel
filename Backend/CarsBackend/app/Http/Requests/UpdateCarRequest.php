<?php

namespace App\Http\Requests;

class UpdateCarRequest extends StoreCarRequest
{
    protected function requirement(): string
    {
        return 'sometimes';
    }
}
