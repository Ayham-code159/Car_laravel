<?php

namespace App\Http\Requests;

class UpdateCarPublicationRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['is_published' => ['required', 'boolean']];
    }
}
