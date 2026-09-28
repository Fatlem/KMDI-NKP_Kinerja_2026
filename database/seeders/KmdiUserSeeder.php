<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\KmdiUser;

class KmdiUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['username' => 'admin', 'nama' => 'Administrator', 'password' => 'pangan2026', 'role' => 'admin'],
            // Tambahkan user PIC di sini sesuai kebutuhan
            // ['username' => 'biro_mkdi', 'nama' => 'Biro MKDI', 'password' => 'password123', 'role' => 'pic'],
        ];

        foreach ($users as $u) {
            KmdiUser::updateOrCreate(
                ['username' => $u['username']],
                ['nama' => $u['nama'], 'password' => Hash::make($u['password']), 'role' => $u['role']]
            );
        }
    }
}
