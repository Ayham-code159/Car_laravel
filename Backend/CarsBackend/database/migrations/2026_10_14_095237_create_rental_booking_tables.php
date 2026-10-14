<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table): void {
            $table->id();
            $table->uuid('booking_reference')->unique();
            $table->foreignId('car_id')->constrained()->restrictOnDelete();
            $table->string('customer_name', 150);
            $table->string('customer_phone', 30);
            $table->string('customer_email')->nullable();
            $table->foreignId('pickup_location_id')->constrained('locations')->restrictOnDelete();
            $table->dateTime('pickup_at');
            $table->dateTime('return_at');
            $table->decimal('estimated_total', 14, 2);
            $table->char('currency', 3);
            $table->enum('status', ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['car_id', 'status', 'pickup_at', 'return_at']);
            $table->index(['status', 'created_at']);
        });
        Schema::create('car_unavailable_periods', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('car_id')->constrained()->restrictOnDelete();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->string('reason', 500);
            $table->timestamps();
            $table->index(['car_id', 'start_at', 'end_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_unavailable_periods');
        Schema::dropIfExists('bookings');
    }
};
