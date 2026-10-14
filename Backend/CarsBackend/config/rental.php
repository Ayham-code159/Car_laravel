<?php

return [
    'admin_username' => env('ADMIN_USERNAME'),
    'admin_password' => env('ADMIN_PASSWORD'),
    'token_hours' => (int) env('ADMIN_TOKEN_HOURS', 12),
    'max_rental_days' => (int) env('RENTAL_MAX_DAYS', 90),
    'max_images' => (int) env('CAR_MAX_IMAGES', 12),
    'max_uploads' => (int) env('CAR_MAX_UPLOADS', 6),
    'image_max_kb' => (int) env('CAR_IMAGE_MAX_KB', 5120),
];
