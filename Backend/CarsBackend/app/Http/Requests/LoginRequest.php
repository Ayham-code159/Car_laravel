<?php

namespace App\Http\Requests;

class LoginRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['username' => ['required', 'string', 'max:100'], 'password' => ['required', 'string', 'max:255']];
    }
}
