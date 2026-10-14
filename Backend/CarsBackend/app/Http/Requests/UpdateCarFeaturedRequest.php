<?php

namespace App\Http\Requests;

class UpdateCarFeaturedRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['is_featured' => ['required', 'boolean']];
    }
}
