<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class CreateManualBookingRequest extends StoreBookingRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), ['status' => ['sometimes', Rule::in(['pending', 'confirmed'])]]);
    }
}
