<?php

namespace App\Http\Requests;

class UpdateCategoryRequest extends StoreCategoryRequest
{
    protected function requirement(): string
    {
        return 'sometimes';
    }
}
