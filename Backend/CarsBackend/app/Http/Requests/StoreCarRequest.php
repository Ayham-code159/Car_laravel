<?php

namespace App\Http\Requests;

use App\Enums\FuelType;
use App\Enums\OperationalStatus;
use App\Enums\Transmission;
use Illuminate\Validation\Rule;

class StoreCarRequest extends ApiRequest
{
    protected function requirement(): string
    {
        return 'required';
    }

    public function rules(): array
    {
        $required = $this->requirement();
        $id = $this->route('id');

        return [
            'inventory_code' => [$required, 'string', 'max:80', 'regex:/^[A-Za-z0-9][A-Za-z0-9_-]*$/', Rule::unique('cars')->ignore($id)],
            'brand_id' => [$required, 'integer', Rule::exists('brands', 'id')],
            'category_id' => [$required, 'integer', Rule::exists('categories', 'id')],
            'location_id' => [$required, 'integer', Rule::exists('locations', 'id')],
            'model' => [$required, 'string', 'max:120'],
            'slug' => ['sometimes', 'string', 'max:200', 'regex:/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/', Rule::notIn(['featured']), Rule::unique('cars')->ignore($id)],
            'year' => [$required, 'integer', 'between:1990,'.(now()->year + 1)],
            'price_per_day' => [$required, 'decimal:0,2', 'gt:0', 'max:99999999.99'],
            'currency' => [$required, 'string', 'regex:/^[A-Z]{3}$/'],
            'transmission' => [$required, Rule::enum(Transmission::class)],
            'fuel_type' => [$required, Rule::enum(FuelType::class)],
            'seats' => [$required, 'integer', 'between:1,12'], 'luggage_count' => [$required, 'integer', 'between:0,20'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'operational_status' => ['sometimes', Rule::enum(OperationalStatus::class)],
            'is_published' => ['sometimes', 'boolean'], 'is_featured' => ['sometimes', 'boolean'],
        ];
    }
}
