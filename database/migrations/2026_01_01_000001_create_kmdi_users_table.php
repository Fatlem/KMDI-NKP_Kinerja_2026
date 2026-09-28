<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kmdi_users', function (Blueprint $table) {
            $table->id();
            $table->string('username', 100)->unique();
            $table->string('nama');
            $table->string('password');
            $table->string('role', 50)->default('pic'); // 'admin' | 'pic'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kmdi_users');
    }
};
