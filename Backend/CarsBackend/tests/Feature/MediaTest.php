<?php

namespace Tests\Feature;

use App\Models\Car;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\Conversions\FileManipulator;
use Tests\ApiTestCase;

class MediaTest extends ApiTestCase
{
    public function test_upload_generates_thumbnails_and_keeps_exactly_one_primary_image(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create();
        $response = $this->post('/api/v1/admin/cars/'.$car->id.'/images', [
            'images' => [UploadedFile::fake()->image('front.jpg', 800, 600), UploadedFile::fake()->image('rear.png', 800, 600)],
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonCount(2, 'data');
        $first = $response->json('data.0.id');
        $second = $response->json('data.1.id');
        $this->assertTrue($response->json('data.0.isPrimary'));
        $this->assertFalse($response->json('data.1.isPrimary'));
        foreach ($car->fresh()->getMedia('car_images') as $image) {
            $this->assertTrue($image->hasGeneratedConversion('thumb'));
            Storage::disk('public')->assertExists($image->getPathRelativeToRoot());
        }
        $this->patchJson('/api/v1/admin/cars/'.$car->id.'/images/'.$second.'/primary')->assertOk();
        $this->getJson('/api/v1/cars/'.$car->slug)->assertOk()
            ->assertJsonPath('data.primaryImageUrl', $car->fresh()->getMedia('car_images')->last()->getUrl());
        $this->patchJson('/api/v1/admin/cars/'.$car->id.'/images/order', ['media_ids' => [$second, $first]])
            ->assertOk()->assertJsonPath('data.0.id', $second)->assertJsonPath('data.0.isPrimary', true);
        $this->deleteJson('/api/v1/admin/cars/'.$car->id.'/images/'.$second)->assertOk();
        $remaining = $car->fresh()->getFirstMedia('car_images');
        $this->assertSame($first, $remaining->id);
        $this->assertTrue($remaining->getCustomProperty('primary'));
        $this->deleteJson('/api/v1/admin/cars/'.$car->id.'/images/'.$first)->assertOk();
        $this->getJson('/api/v1/cars/'.$car->slug)->assertOk()->assertJsonPath('data.primaryImageUrl', null);
    }

    public function test_invalid_images_size_and_upload_counts_are_rejected(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create();
        $this->post('/api/v1/admin/cars/'.$car->id.'/images', [
            'images' => [UploadedFile::fake()->createWithContent('spoofed.jpg', 'This is not an image.')],
        ], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->post('/api/v1/admin/cars/'.$car->id.'/images', [
            'images' => [UploadedFile::fake()->image('oversize.jpg')->size(6000)],
        ], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->post('/api/v1/admin/cars/'.$car->id.'/images', ['images' => []], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->assertDatabaseCount('media', 0);
    }

    public function test_another_cars_image_cannot_be_deleted_selected_or_reordered(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create();
        $other = Car::factory()->create();
        $image = $other->addMedia(UploadedFile::fake()->image('other.jpg'))->toMediaCollection('car_images');
        $this->deleteJson('/api/v1/admin/cars/'.$car->id.'/images/'.$image->id)->assertNotFound();
        $this->patchJson('/api/v1/admin/cars/'.$car->id.'/images/'.$image->id.'/primary')->assertNotFound();
        $this->patchJson('/api/v1/admin/cars/'.$car->id.'/images/order', ['media_ids' => [$image->id]])->assertConflict();
        $this->assertDatabaseHas('media', ['id' => $image->id, 'model_id' => $other->id]);
    }

    public function test_maximum_car_image_count_is_enforced_across_requests(): void
    {
        $this->signInAdmin();
        config(['rental.max_images' => 1]);
        $car = Car::factory()->create();
        $this->post('/api/v1/admin/cars/'.$car->id.'/images', ['images' => [UploadedFile::fake()->image('first.jpg')]], ['Accept' => 'application/json'])->assertCreated();
        $this->post('/api/v1/admin/cars/'.$car->id.'/images', ['images' => [UploadedFile::fake()->image('second.jpg')]], ['Accept' => 'application/json'])->assertConflict();
        $this->assertDatabaseCount('media', 1);
    }

    public function test_failed_thumbnail_generation_removes_partial_media_and_files(): void
    {
        $this->signInAdmin();
        $car = Car::factory()->create();
        $this->mock(FileManipulator::class)
            ->shouldReceive('createDerivedFiles')->andThrow(new \RuntimeException('Conversion failed.'));
        $this->post('/api/v1/admin/cars/'.$car->id.'/images', ['images' => [UploadedFile::fake()->image('first.jpg')]], ['Accept' => 'application/json'])->assertStatus(500);
        $this->assertDatabaseCount('media', 0);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }
}
