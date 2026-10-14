<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['brands', 'categories'] as $name) {
            Schema::create($name, function (Blueprint $table): void {
                $table->id();
                $table->string('name', 100)->unique();
                $table->string('slug', 120)->unique();
                $table->timestamps();
            });
        }
        Schema::create('locations', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150)->unique();
            $table->string('city', 100);
            $table->string('country', 100);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
        Schema::create('cars', function (Blueprint $table): void {
            $table->id();
            $table->string('inventory_code', 80)->unique();
            $table->foreignId('brand_id')->constrained()->restrictOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('location_id')->constrained()->restrictOnDelete();
            $table->string('model', 120);
            $table->string('slug', 200)->unique();
            $table->unsignedSmallInteger('year');
            $table->decimal('price_per_day', 10, 2);
            $table->char('currency', 3)->default('USD');
            $table->enum('transmission', ['automatic', 'manual']);
            $table->enum('fuel_type', ['petrol', 'diesel', 'hybrid', 'electric']);
            $table->unsignedTinyInteger('seats');
            $table->unsignedTinyInteger('luggage_count');
            $table->text('description')->nullable();
            $table->enum('operational_status', ['active', 'maintenance', 'inactive'])->default('active');
            $table->boolean('is_published')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['is_published', 'operational_status', 'deleted_at']);
            $table->index(['is_featured', 'is_published']);
            $table->index('price_per_day');
            $table->index('model');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('brands');
    }
};
