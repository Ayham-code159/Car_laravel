<?php

namespace App\Console\Commands;

use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ProvisionAdmin extends Command
{
    protected $signature = 'admin:provision {--rotate : Explicitly replace the existing administrator credentials and revoke all tokens}';

    protected $description = 'Provision the single administrator from ADMIN_USERNAME and ADMIN_PASSWORD';

    public function handle(): int
    {
        if ($this->option('rotate')) {
            $username = config('rental.admin_username');
            $password = config('rental.admin_password');
            if (! is_string($username) || ! preg_match('/^[A-Za-z0-9_.-]{3,100}$/', $username)
                || ! is_string($password) || strlen($password) < 12) {
                throw new RuntimeException('Configure valid ADMIN_USERNAME and ADMIN_PASSWORD (at least 12 characters).');
            }
            DB::transaction(function () use ($username, $password): void {
                $admin = User::where('is_admin', true)->lockForUpdate()->sole();
                $admin->update(['username' => $username, 'password' => $password]);
                $admin->tokens()->update(['revoked' => true]);
            });
        } else {
            app(AdminUserSeeder::class)->run();
        }
        $this->info('Administrator provisioning completed.');

        return self::SUCCESS;
    }
}
