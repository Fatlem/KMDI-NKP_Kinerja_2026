<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KmdiUser;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $username = trim($request->input('username', ''));
        $password = $request->input('password', '');

        if (! $username || ! $password) {
            return response()->json(['success' => false, 'message' => 'Username dan password wajib diisi.']);
        }

        $user = KmdiUser::whereRaw('LOWER(username) = ?', [strtolower($username)])->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Username atau password salah.']);
        }

        $userData = [
            'username' => $user->username,
            'nama'     => $user->nama,
            'role'     => $user->role,
        ];

        session(['kmdi_user' => $userData]);

        return response()->json(['success' => true, 'user' => $userData]);
    }

    public function logout()
    {
        session()->forget('kmdi_user');
        return response()->json(['success' => true]);
    }
}
