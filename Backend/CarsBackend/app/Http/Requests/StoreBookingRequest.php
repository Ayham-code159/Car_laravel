<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesRentalPeriod;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends ApiRequest
{
    use ValidatesRentalPeriod;

    public function rules(): array
    {
        return [
            'car_slug' => ['required', 'string', 'max:200', Rule::exists('cars', 'slug')->whereNull('deleted_at')],
            'customer_name' => ['required', 'string', 'max:150'],
            'customer_phone' => ['bail', 'required', 'string', 'regex:/^\+?[0-9][0-9 ()-]{6,24}[0-9]$/',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $digits = strlen(preg_replace('/[^0-9]/', '', $value));
                    if ($digits < 7 || $digits > 15) {
                        $fail('The phone number must contain between 7 and 15 digits.');
                    }
                }],
            'customer_email' => ['sometimes', 'nullable', 'email:rfc', 'max:255'],
            'pickup_location_id' => ['required', 'integer', Rule::exists('locations', 'id')->where('is_active', true)],
            'pickup_at' => ['required', 'after_or_equal:now', ...$this->datetimeRules()],
            'return_at' => ['required', 'after:pickup_at', ...$this->datetimeRules()],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
