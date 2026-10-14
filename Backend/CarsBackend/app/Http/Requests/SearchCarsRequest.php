<?php

namespace App\Http\Requests;

use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Http\Requests\Concerns\ValidatesRentalPeriod;
use Illuminate\Validation\Rule;

class SearchCarsRequest extends ApiRequest
{
    use ValidatesRentalPeriod;

    public function rules(): array
    {
        return [
            'brand' => ['sometimes', 'string', 'max:100'], 'model' => ['sometimes', 'string', 'max:120'],
            'search' => ['sometimes', 'string', 'max:120'], 'category' => ['sometimes', 'string', 'max:120'],
            'location' => ['sometimes', 'string', 'max:150'],
            'min_price' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'max_price' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99', ...($this->has('min_price') ? ['gte:min_price'] : [])],
            'transmission' => ['sometimes', Rule::enum(Transmission::class)],
            'fuel_type' => ['sometimes', Rule::enum(FuelType::class)],
            'pickup_at' => ['required_with:return_at', 'after_or_equal:now', ...$this->datetimeRules()],
            'return_at' => ['required_with:pickup_at', 'after:pickup_at', ...$this->datetimeRules()],
            'sort' => ['sometimes', Rule::in(['price_asc', 'price_desc', 'newest', 'year_desc', 'model_asc'])],
            'page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'between:1,100'],
        ];
    }
}
