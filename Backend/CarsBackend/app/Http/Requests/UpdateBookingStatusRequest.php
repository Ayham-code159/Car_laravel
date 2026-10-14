<?php

namespace App\Http\Requests;

use App\Enums\BookingStatus;
use Illuminate\Validation\Rule;

class UpdateBookingStatusRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['status' => ['required', Rule::enum(BookingStatus::class)]];
    }
}
