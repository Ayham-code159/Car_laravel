<?php

namespace Tests\Unit;

use App\Services\PricingService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class PricingTest extends TestCase
{
    public static function rentalDurations(): array
    {
        return [[1, 1, '19.99'], [86400, 1, '19.99'], [86401, 2, '39.98'], [172800, 2, '39.98']];
    }

    #[DataProvider('rentalDurations')]
    public function test_daily_pricing_uses_exact_decimal_arithmetic(int $seconds, int $days, string $total): void
    {
        $service = new PricingService;
        $pickup = CarbonImmutable::parse('2030-01-01T00:00:00Z');
        $return = $pickup->addSeconds($seconds);
        $this->assertSame($days, $service->chargeableDays($pickup, $return));
        $this->assertSame($total, $service->estimate('19.99', $pickup, $return));
    }

    public function test_invalid_period_is_rejected(): void
    {
        $date = CarbonImmutable::parse('2030-01-01T00:00:00Z');
        $this->expectException(\InvalidArgumentException::class);
        (new PricingService)->estimate('25.00', $date, $date);
    }
}
