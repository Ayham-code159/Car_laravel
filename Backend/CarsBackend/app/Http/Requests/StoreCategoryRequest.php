<?php

namespace App\Http\Requests;

use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends ApiRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->filled('name') && ! $this->has('slug')) {
            $this->merge(['slug' => Str::slug((string) $this->input('name'))]);
        }
    }

    protected function requirement(): string
    {
        return 'required';
    }

    public function rules(): array
    {
        return [
            'name' => [$this->requirement(), 'string', 'max:100', Rule::unique('categories')->ignore($this->route('id'))],
            'slug' => [$this->requirement(), 'string', 'max:120', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('categories')->ignore($this->route('id'))],
        ];
    }
}
