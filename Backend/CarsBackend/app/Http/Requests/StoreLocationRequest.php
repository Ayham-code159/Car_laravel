<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreLocationRequest extends ApiRequest
{
    protected function requirement(): string
    {
        return 'required';
    }

    public function rules(): array
    {
        return ['name' => [$this->requirement(), 'string', 'max:150', Rule::unique('locations')->ignore($this->route('id'))],
            'city' => [$this->requirement(), 'string', 'max:100'], 'country' => [$this->requirement(), 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean']];
    }
}
