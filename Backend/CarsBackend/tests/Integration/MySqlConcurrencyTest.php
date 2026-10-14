<?php

namespace Tests\Integration;

use App\Models\Booking;
use App\Models\Car;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class MySqlConcurrencyTest extends TestCase
{
    private ?string $ownedSchema = null;

    protected function setUp(): void
    {
        parent::setUp();
        if (getenv('RUN_MYSQL_CONCURRENCY_TESTS') !== '1') {
            $this->markTestSkipped('Set RUN_MYSQL_CONCURRENCY_TESTS=1 to test real MySQL row locks in a temporary database.');
        }
        $adminConfig = config('database.connections.mysql');
        $adminConfig['database'] = null;
        $adminConfig['url'] = null;
        config(['database.connections.concurrency_admin' => $adminConfig]);
        $schema = 'cars_api_test_'.bin2hex(random_bytes(8));
        DB::connection('concurrency_admin')->statement('CREATE DATABASE `'.$schema.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        $this->ownedSchema = $schema;
        $testConfig = $adminConfig;
        $testConfig['database'] = $schema;
        config(['database.connections.mysql_concurrency' => $testConfig, 'database.default' => 'mysql_concurrency']);
        $this->assertSame(0, Artisan::call('migrate', ['--database' => 'mysql_concurrency', '--force' => true, '--no-interaction' => true]));
    }

    protected function tearDown(): void
    {
        if ($this->ownedSchema !== null) {
            $schema = $this->ownedSchema;
            if (! preg_match('/^cars_api_test_[a-f0-9]{16}$/', $schema)) {
                throw new \LogicException('Refusing to remove an unrecognized test database.');
            }
            DB::purge('mysql_concurrency');
            DB::connection('concurrency_admin')->statement('DROP DATABASE `'.$schema.'`');
            DB::purge('concurrency_admin');
            config(['database.default' => 'sqlite']);
        }
        parent::tearDown();
    }

    public static function competingOperations(): array
    {
        return [['confirm'], ['manual'], ['block']];
    }

    #[DataProvider('competingOperations')]
    public function test_competing_confirmations_manual_bookings_and_blocks_cannot_both_succeed(string $otherAction): void
    {
        $car = Car::factory()->create();
        $first = Booking::factory()->create(['car_id' => $car->id, 'pickup_location_id' => $car->location_id]);
        $second = Booking::factory()->create(['car_id' => $car->id, 'pickup_location_id' => $car->location_id,
            'pickup_at' => $first->pickup_at, 'return_at' => $first->return_at]);
        $start = $first->pickup_at->format('Y-m-d\TH:i:s\Z');
        $end = $first->return_at->format('Y-m-d\TH:i:s\Z');
        $env = ['APP_ENV' => 'testing', 'DB_CONNECTION' => 'mysql', 'DB_DATABASE' => $this->ownedSchema,
            'DB_URL' => '', 'CAR_RENTAL_CONCURRENCY_DATABASE' => $this->ownedSchema,
            'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array', 'LOG_CHANNEL' => 'null'];
        $worker = base_path('tests/Support/booking-worker.php');
        $processes = [new Process([PHP_BINARY, $worker, 'confirm', (string) $first->id], base_path(), $env, timeout: 20),
            new Process([PHP_BINARY, $worker, $otherAction, (string) ($otherAction === 'confirm' ? $second->id : $car->id), $start, $end], base_path(), $env, timeout: 20)];

        DB::beginTransaction();
        try {
            Car::lockForUpdate()->findOrFail($car->id);
            foreach ($processes as $process) {
                $process->start();
            }
            $deadline = microtime(true) + 10;
            while ((! str_contains($processes[0]->getOutput(), 'READY') || ! str_contains($processes[1]->getOutput(), 'READY')) && microtime(true) < $deadline) {
                usleep(10000);
            }
            $this->assertStringContainsString('READY', $processes[0]->getOutput());
            $this->assertStringContainsString('READY', $processes[1]->getOutput());
            usleep(200000);
            $this->assertTrue($processes[0]->isRunning());
            $this->assertTrue($processes[1]->isRunning());
            DB::commit();
            foreach ($processes as $process) {
                $process->wait();
                $this->assertSame(0, $process->getExitCode(), $process->getErrorOutput());
            }
            $outputs = array_map(fn (Process $process) => trim(str_replace('READY', '', $process->getOutput())), $processes);
            sort($outputs);
            $this->assertSame(['CONFLICT', 'SUCCESS'], $outputs);
        } finally {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            foreach ($processes as $process) {
                if ($process->isRunning()) {
                    $process->stop();
                }
            }
        }
    }
}
