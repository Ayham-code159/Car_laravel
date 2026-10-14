<?php

namespace Tests\Unit;

use App\Enums\BookingStatus;
use PHPUnit\Framework\TestCase;

class BookingStatusTest extends TestCase
{
    public function test_only_documented_transitions_are_allowed(): void
    {
        $allowed = ['pending' => ['confirmed', 'rejected', 'cancelled'], 'confirmed' => ['cancelled', 'completed']];
        foreach (BookingStatus::cases() as $from) {
            foreach (BookingStatus::cases() as $to) {
                $this->assertSame(in_array($to->value, $allowed[$from->value] ?? [], true), $from->canTransitionTo($to));
            }
        }
    }
}
