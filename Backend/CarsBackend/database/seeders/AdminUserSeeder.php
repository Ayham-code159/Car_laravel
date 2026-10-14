<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $username = config('rental.admin_username');
        $password = config('rental.admin_password');
        if (! is_string($username) || ! preg_match('/^[A-Za-z0-9_.-]{3,100}$/', $username)) {
            throw new RuntimeException('Configure a valid ADMIN_USERNAME before provisioning.');
        }
        DB::transaction(function () use ($username, $password): void {
            $admin = User::where('is_admin', true)->lockForUpdate()->first();
            if ($admin) {
                if ($admin->username !== $username) {
                    throw new RuntimeException('An administrator already exists. Use admin:provision --rotate for an explicit credential rotation.');
                }

                return;
            }
            if (! is_string($password) || strlen($password) < 12) {
                throw new RuntimeException('Configure ADMIN_PASSWORD with at least 12 characters before provisioning.');
            }
            if (User::where('username', $username)->exists()) {
                throw new RuntimeException('The requested username is already assigned.');
            }
            $user = new User(['username' => $username, 'password' => $password]);
            $user->is_admin = true;
            $user->save();
        });
    }
}
