<?php

namespace App\Providers;

use App\Contracts;
use App\Http\Responses\ApiResponse;
use App\Services;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        Passport::ignoreRoutes();
        $this->app->bind(Contracts\AuthServiceInterface::class, Services\AuthService::class);
        $this->app->bind(Contracts\CarServiceInterface::class, Services\CarService::class);
        $this->app->bind(Contracts\CatalogServiceInterface::class, Services\CatalogService::class);
        $this->app->bind(Contracts\BookingServiceInterface::class, Services\BookingService::class);
        $this->app->bind(Contracts\AvailabilityServiceInterface::class, Services\AvailabilityService::class);
        $this->app->bind(Contracts\DashboardServiceInterface::class, Services\DashboardService::class);
    }

    public function boot(): void
    {
        Passport::personalAccessTokensExpireIn(now()->addHours(max(1, config('rental.token_hours'))));

        $limited = function (Request $request, array $headers) {
            $response = ApiResponse::error('Too many requests. Please try again later.', [], 429);
            $response->headers->add($headers);

            return $response;
        };
        RateLimiter::for('admin-login', fn (Request $request) => [
            Limit::perMinute(5)->by('login:'.$request->ip())->response($limited),
            Limit::perMinute(5)->by('username:'.hash('sha256', mb_strtolower((string) $request->input('username'))))->response($limited),
        ]);
        RateLimiter::for('booking-requests', fn (Request $request) => Limit::perMinute(5)->by($request->ip())->response($limited));
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->ip())->response($limited));
    }
}
