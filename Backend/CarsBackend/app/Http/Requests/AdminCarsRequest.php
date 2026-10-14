<?php

namespace App\Http\Requests;

use App\Enums\OperationalStatus;
use Illuminate\Validation\Rule;

class AdminCarsRequest extends SearchCarsRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'operational_status' => ['sometimes', Rule::enum(OperationalStatus::class)],
            'is_published' => ['sometimes', 'boolean'], 'is_featured' => ['sometimes', 'boolean'],
            'archived' => ['sometimes', 'boolean'],
        ]);
    }
}
