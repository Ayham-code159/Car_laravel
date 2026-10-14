<?php

namespace App\Http\Requests;

use App\Enums\BookingStatus;
use App\Http\Requests\Concerns\ValidatesRentalPeriod;
use Illuminate\Validation\Rule;

class SearchBookingsRequest extends ApiRequest
{
    use ValidatesRentalPeriod;

    public function rules(): array
    {
        return ['status' => ['sometimes', Rule::enum(BookingStatus::class)], 'car_id' => ['sometimes', 'integer', 'min:1'],
            'booking_reference' => ['sometimes', 'uuid'], 'search' => ['sometimes', 'string', 'max:150'],
            'from' => ['sometimes', ...$this->datetimeRules()],
            'to' => ['sometimes', ...$this->datetimeRules(), ...($this->has('from') ? ['after_or_equal:from'] : [])],
            'page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'between:1,100']];
    }
}
