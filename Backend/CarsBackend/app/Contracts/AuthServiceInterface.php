<?php

namespace App\Contracts;

use App\Models\User;

interface AuthServiceInterface
{
    public function login(string $username, string $password): array;

    public function logout(User $user): void;
}
