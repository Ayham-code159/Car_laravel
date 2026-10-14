<?php

namespace App\Http\Requests\Concerns;

use Carbon\CarbonImmutable;
use Illuminate\Validation\Validator;

trait ValidatesRentalPeriod
{
    /** Require an explicit timezone; all persistence is normalized to UTC. */
    protected function datetimeRules(): array
    {
        return ['date', 'regex:/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/'];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->has('pickup_at') || $validator->errors()->has('return_at')
                || ! $this->filled('pickup_at') || ! $this->filled('return_at')) {
                return;
            }
            $start = CarbonImmutable::parse($this->input('pickup_at'))->utc();
            $end = CarbonImmutable::parse($this->input('return_at'))->utc();
            if ($end->getTimestamp() - $start->getTimestamp() > config('rental.max_rental_days') * 86400) {
                $validator->errors()->add('return_at', 'The rental period exceeds the maximum allowed duration.');
            }
        }];
    }
}
