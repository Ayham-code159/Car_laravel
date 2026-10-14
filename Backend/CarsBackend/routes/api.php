<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\Public as PublicApi;
use Illuminate\Support\Facades\Route;

Route::pattern('id', '[0-9]+');
Route::pattern('mediaId', '[0-9]+');

Route::prefix('v1')->name('api.v1.')->middleware('throttle:api')->group(function (): void {
    Route::get('brands', [PublicApi\CatalogController::class, 'brands'])->name('brands');
    Route::get('categories', [PublicApi\CatalogController::class, 'categories'])->name('categories');
    Route::get('locations', [PublicApi\CatalogController::class, 'locations'])->name('locations');
    Route::get('cars', [PublicApi\CarController::class, 'index'])->name('cars');
    Route::get('cars/featured', [PublicApi\CarController::class, 'featured'])->name('cars.featured');
    Route::get('cars/{slug}', [PublicApi\CarController::class, 'show'])->where('slug', '[a-z][a-z0-9]*(?:-[a-z0-9]+)*')->name('cars.show');
    Route::post('booking-requests', [PublicApi\BookingController::class, 'store'])->middleware('throttle:booking-requests')->name('bookings.store');

    Route::prefix('admin')->name('admin.')->group(function (): void {
        Route::post('login', [Admin\AuthController::class, 'login'])->middleware('throttle:admin-login')->name('login');

        Route::middleware(['auth:api', 'admin'])->group(function (): void {
            Route::post('logout', [Admin\AuthController::class, 'logout'])->name('logout');
            Route::get('me', [Admin\AuthController::class, 'me'])->name('me');
            Route::get('dashboard', Admin\DashboardController::class)->name('dashboard');

            Route::get('cars', [Admin\CarController::class, 'index'])->name('cars.index');
            Route::post('cars', [Admin\CarController::class, 'store'])->name('cars.store');
            Route::get('cars/{id}', [Admin\CarController::class, 'show'])->name('cars.show');
            Route::put('cars/{id}', [Admin\CarController::class, 'update'])->name('cars.update');
            Route::delete('cars/{id}', [Admin\CarController::class, 'destroy'])->name('cars.destroy');
            Route::patch('cars/{id}/status', [Admin\CarController::class, 'status'])->name('cars.status');
            Route::patch('cars/{id}/featured', [Admin\CarController::class, 'featured'])->name('cars.featured');
            Route::patch('cars/{id}/publication', [Admin\CarController::class, 'publication'])->name('cars.publication');

            Route::post('cars/{id}/images', [Admin\CarImageController::class, 'store'])->name('images.store');
            Route::delete('cars/{id}/images/{mediaId}', [Admin\CarImageController::class, 'destroy'])->name('images.destroy');
            Route::patch('cars/{id}/images/{mediaId}/primary', [Admin\CarImageController::class, 'primary'])->name('images.primary');
            Route::patch('cars/{id}/images/order', [Admin\CarImageController::class, 'order'])->name('images.order');

            Route::post('cars/{id}/blocked-periods', [Admin\AvailabilityController::class, 'store'])->name('blocks.store');
            Route::delete('blocked-periods/{id}', [Admin\AvailabilityController::class, 'destroy'])->name('blocks.destroy');

            Route::get('categories', [Admin\CatalogController::class, 'categories'])->name('categories.index');
            Route::post('categories', [Admin\CatalogController::class, 'storeCategory'])->name('categories.store');
            Route::put('categories/{id}', [Admin\CatalogController::class, 'updateCategory'])->name('categories.update');
            Route::delete('categories/{id}', [Admin\CatalogController::class, 'deleteCategory'])->name('categories.destroy');
            Route::get('locations', [Admin\CatalogController::class, 'locations'])->name('locations.index');
            Route::post('locations', [Admin\CatalogController::class, 'storeLocation'])->name('locations.store');
            Route::put('locations/{id}', [Admin\CatalogController::class, 'updateLocation'])->name('locations.update');
            Route::delete('locations/{id}', [Admin\CatalogController::class, 'deleteLocation'])->name('locations.destroy');

            Route::get('bookings', [Admin\BookingController::class, 'index'])->name('bookings.index');
            Route::post('bookings', [Admin\BookingController::class, 'store'])->name('bookings.store');
            Route::get('bookings/{id}', [Admin\BookingController::class, 'show'])->name('bookings.show');
            Route::patch('bookings/{id}/status', [Admin\BookingController::class, 'status'])->name('bookings.status');
        });
    });
});
