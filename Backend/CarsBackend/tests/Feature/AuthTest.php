<?php

namespace Tests\Feature;

use App\Models\User;
use Laravel\Passport\ClientRepository;
use Laravel\Passport\Passport;
use Laravel\Passport\Token;
use Tests\ApiTestCase;

class AuthTest extends ApiTestCase
{
    public function test_admin_login_issues_a_real_passport_token_and_logout_revokes_it(): void
    {
        $admin = User::factory()->admin()->create(['username' => 'demo-admin', 'password' => 'demo-password-123']);
        app(ClientRepository::class)->createPersonalAccessGrantClient('Test admin client', 'users');
        $response = $this->postJson('/api/v1/admin/login', ['username' => 'demo-admin', 'password' => 'demo-password-123']);
        $response->assertOk()->assertJsonPath('success', true)->assertJsonPath('data.admin.username', 'demo-admin');
        $token = $response->json('data.accessToken');
        $this->assertNotEmpty($token);
        $this->getJson('/api/v1/admin/me', ['Authorization' => 'Bearer '.$token])
            ->assertOk()->assertJsonPath('data.id', $admin->id)->assertJsonMissingPath('data.password');
        $this->postJson('/api/v1/admin/logout', [], ['Authorization' => 'Bearer '.$token])->assertOk();
        $this->assertTrue(Token::sole()->revoked);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/admin/me', ['Authorization' => 'Bearer '.$token])->assertUnauthorized();
    }

    public function test_invalid_credentials_and_non_admin_credentials_are_rejected(): void
    {
        User::factory()->admin()->create(['username' => 'demo-admin', 'password' => 'demo-password-123']);
        $this->postJson('/api/v1/admin/login', ['username' => 'demo-admin', 'password' => 'wrong-password'])->assertUnauthorized();
        User::factory()->create(['username' => 'ordinary-user', 'password' => 'demo-password-123']);
        $this->postJson('/api/v1/admin/login', ['username' => 'ordinary-user', 'password' => 'demo-password-123'])->assertUnauthorized();
    }

    public function test_protected_route_requires_a_token_and_explicit_admin_authorization(): void
    {
        $this->getJson('/api/v1/admin/cars')->assertUnauthorized()->assertJsonPath('success', false);
        Passport::actingAs(User::factory()->create(), [], 'api');
        $this->getJson('/api/v1/admin/cars')->assertForbidden();
        $this->signInAdmin();
        $this->getJson('/api/v1/admin/cars')->assertOk();
    }

    public function test_login_requires_username_and_password_and_is_rate_limited(): void
    {
        $this->postJson('/api/v1/admin/login', [])->assertUnprocessable();
        for ($attempt = 0; $attempt < 4; $attempt++) {
            $this->postJson('/api/v1/admin/login', ['username' => 'unknown', 'password' => 'wrong-password'])->assertUnauthorized();
        }
        $this->postJson('/api/v1/admin/login', ['username' => 'unknown', 'password' => 'wrong-password'])
            ->assertStatus(429)->assertJsonPath('success', false)->assertHeader('Retry-After');
    }

    public function test_registration_password_and_oauth_token_endpoints_are_absent(): void
    {
        foreach (['/api/v1/register', '/api/v1/admin/register', '/api/v1/admin/change-password',
            '/api/v1/admin/forgot-password', '/api/v1/admin/reset-password', '/oauth/token'] as $path) {
            $this->postJson($path)->assertNotFound();
        }
    }
}
