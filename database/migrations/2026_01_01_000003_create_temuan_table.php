<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temuan', function (Blueprint $table) {
            $table->id();
            $table->string('no', 50)->nullable();           // kosong = sub-baris
            $table->text('temuan')->nullable();             // kosong = sub-baris
            $table->text('sub_temuan')->nullable();
            $table->text('kriteria')->nullable();
            $table->text('sebab')->nullable();
            $table->text('rekomendasi')->nullable();
            $table->string('pic')->nullable();              // nama PIC (sama dengan pic.nama)
            $table->text('rencana_aksi')->nullable();
            $table->string('jadwal_pelaksanaan')->nullable();
            $table->text('output')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable(); // null = baris utama
            $table->integer('sort_order')->default(0);          // urutan tampil
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('temuan')->onDelete('set null');
            $table->index('parent_id');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temuan');
    }
};
