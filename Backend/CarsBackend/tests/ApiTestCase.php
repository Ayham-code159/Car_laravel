<?php

namespace Tests;

use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;
use phpseclib4\Crypt\RSA;

abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    private static ?array $testKeys = null;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        if (self::$testKeys === null) {
            $key = RSA::createKey(2048);
            self::$testKeys = [(string) $key, (string) $key->getPublicKey()];
        }
        config(['passport.private_key' => self::$testKeys[0], 'passport.public_key' => self::$testKeys[1]]);
    }

    protected function signInAdmin(): User
    {
        $user = User::factory()->admin()->create();
        Passport::actingAs($user, [], 'api');

        return $user;
    }

    protected function bookingPayload(Car $car, array $overrides = []): array
    {
        return array_merge(['car_slug' => $car->slug, 'customer_name' => 'Demo Customer',
            'customer_phone' => '+963991234567', 'customer_email' => 'demo@example.test',
            'pickup_location_id' => $car->location_id,
            'pickup_at' => now()->addDays(3)->startOfHour()->format('Y-m-d\TH:i:s\Z'),
            'return_at' => now()->addDays(5)->startOfHour()->format('Y-m-d\TH:i:s\Z'),
            'notes' => 'Please prepare the vehicle.'], $overrides);
    }
}
