<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesRentalPeriod;

class BlockCarPeriodRequest extends ApiRequest
{
    use ValidatesRentalPeriod;

    public function rules(): array
    {
        return ['start_at' => ['required', ...$this->datetimeRules()],
            'end_at' => ['required', 'after:start_at', ...$this->datetimeRules()],
            'reason' => ['required', 'string', 'max:500']];
    }
}
