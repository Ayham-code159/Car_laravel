<?php

namespace App\Services;

use App\Contracts\AvailabilityServiceInterface;
use App\Contracts\CarServiceInterface;
use App\Models\Brand;
use App\Models\Car;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CarService implements CarServiceInterface
{
    public function __construct(private AvailabilityServiceInterface $availability) {}

    public function search(array $filters, bool $admin = false, bool $featured = false): LengthAwarePaginator
    {
        $query = Car::query()->with(['brand', 'category', 'location', 'media']);
        if ($admin) {
            if (filter_var($filters['archived'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $query->onlyTrashed();
            }
            foreach (['operational_status', 'is_published', 'is_featured'] as $field) {
                if (array_key_exists($field, $filters)) {
                    $query->where($field, $filters[$field]);
                }
            }
        } else {
            $query->publiclyVisible();
        }
        if ($featured) {
            $query->where('is_featured', true);
        }
        foreach (['brand', 'category'] as $relation) {
            if (isset($filters[$relation])) {
                $query->whereHas($relation, fn (Builder $related) => $related
                    ->where(fn (Builder $names) => $names->where('name', $filters[$relation])->orWhere('slug', $filters[$relation])));
            }
        }
        if (isset($filters['location'])) {
            $location = $filters['location'];
            $query->whereHas('location', function (Builder $related) use ($location): void {
                $related->where(function (Builder $names) use ($location): void {
                    $names->where('name', $location);
                    if (ctype_digit((string) $location)) {
                        $names->orWhere('id', (int) $location);
                    }
                });
            });
        }
        if (isset($filters['model'])) {
            $query->where('model', 'like', '%'.$filters['model'].'%');
        }
        if (isset($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $query->where(fn (Builder $names) => $names->where('model', 'like', $term)
                ->orWhereHas('brand', fn (Builder $brand) => $brand->where('name', 'like', $term)));
        }
        foreach (['transmission', 'fuel_type'] as $field) {
            if (isset($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }
        if (isset($filters['min_price'])) {
            $query->where('price_per_day', '>=', $filters['min_price']);
        }
        if (isset($filters['max_price'])) {
            $query->where('price_per_day', '<=', $filters['max_price']);
        }
        if (isset($filters['pickup_at'], $filters['return_at'])) {
            $this->availability->filterAvailable($query, CarbonImmutable::parse($filters['pickup_at'])->utc(), CarbonImmutable::parse($filters['return_at'])->utc());
        }
        [$column, $direction] = match ($filters['sort'] ?? 'newest') {
            'price_asc' => ['price_per_day', 'asc'], 'price_desc' => ['price_per_day', 'desc'],
            'year_desc' => ['year', 'desc'], 'model_asc' => ['model', 'asc'], default => ['created_at', 'desc'],
        };

        return $query->orderBy($column, $direction)->orderBy('id')->paginate($filters['per_page'] ?? 15);
    }

    public function findPublic(string $slug): Car
    {
        return Car::publiclyVisible()->with(['brand', 'category', 'location', 'media'])->where('slug', $slug)->firstOrFail();
    }

    public function findAdmin(int $id): Car
    {
        return Car::withTrashed()->with(['brand', 'category', 'location', 'media', 'unavailablePeriods'])->findOrFail($id);
    }

    public function create(array $data): Car
    {
        return DB::transaction(function () use ($data): Car {
            if (! isset($data['slug'])) {
                $brand = Brand::findOrFail($data['brand_id']);
                $name = rtrim(Str::limit(Str::slug($brand->name.'-'.$data['model']), 118, ''), '-');
                $data['slug'] = $name.'-'.Str::slug($data['inventory_code']);
            }
            $car = Car::create($data);

            return $car->load(['brand', 'category', 'location', 'media']);
        });
    }

    public function update(int $id, array $data): Car
    {
        return DB::transaction(function () use ($id, $data): Car {
            $car = Car::lockForUpdate()->findOrFail($id);
            $car->update($data);

            return $car->load(['brand', 'category', 'location', 'media']);
        });
    }

    public function archive(int $id): void
    {
        DB::transaction(function () use ($id): void {
            Car::lockForUpdate()->findOrFail($id)->delete();
        });
    }
}
