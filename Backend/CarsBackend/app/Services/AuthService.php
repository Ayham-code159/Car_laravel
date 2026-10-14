<?php

namespace App\Services;

use App\Contracts\AuthServiceInterface;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Passport\AccessToken;
use Laravel\Passport\Token;

class AuthService implements AuthServiceInterface
{
    public function login(string $username, string $password): array
    {
        $user = User::where('username', $username)->where('is_admin', true)->first();
        $valid = Hash::check($password, $user?->password ?? Hash::make(Str::random(32)));
        if (! $user || ! $valid) {
            throw new AuthenticationException;
        }
        $token = $user->createToken('admin-api');

        return ['accessToken' => $token->accessToken, 'tokenType' => 'Bearer',
            'expiresAt' => $token->token->expires_at->toISOString(),
            'admin' => ['id' => $user->id, 'username' => $user->username]];
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();
        if ($token instanceof AccessToken || $token instanceof Token) {
            $token->revoke();
        }
    }
}
