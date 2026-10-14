<?php

namespace App\Http\Requests;

use App\Enums\OperationalStatus;
use Illuminate\Validation\Rule;

class UpdateCarStatusRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['operational_status' => ['required', Rule::enum(OperationalStatus::class)]];
    }
}
