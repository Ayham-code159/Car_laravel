<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use InvalidArgumentException;

class PricingService
{
    public function chargeableDays(CarbonImmutable $pickup, CarbonImmutable $return): int
    {
        $seconds = $return->getTimestamp() - $pickup->getTimestamp();
        if ($seconds <= 0) {
            throw new InvalidArgumentException('Return must be after pickup.');
        }

        return max(1, intdiv($seconds + 86399, 86400));
    }

    public function estimate(string $dailyPrice, CarbonImmutable $pickup, CarbonImmutable $return): string
    {
        if (! preg_match('/^\d{1,8}(?:\.\d{1,2})?$/', $dailyPrice) || bccomp($dailyPrice, '0', 2) <= 0) {
            throw new InvalidArgumentException('Daily price must be a positive decimal.');
        }

        return bcmul($dailyPrice, (string) $this->chargeableDays($pickup, $return), 2);
    }
}
