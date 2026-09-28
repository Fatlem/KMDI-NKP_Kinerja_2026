<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pic;

class PicSeeder extends Seeder
{
    public function run(): void
    {
        $list = [
            'Biro Manajemen Kinerja Data dan Informasi',
            'Biro Hukum dan Kerjasama',
            'Biro Sumber Daya Manusia dan Organisasi',
            'Biro Umum dan Hubungan Masyarakat',
            'Biro Keuangan dan BMN',
            'Deputi Bidang Koordinasi Tata Niaga dan Distribusi Pangan',
            'Deputi Bidang Koordinasi Usaha Pangan dan Pertanian',
            'Deputi Bidang Koordinasi Keterjangkauan dan Keamanan Pangan',
        ];

        foreach ($list as $nama) {
            Pic::updateOrCreate(['nama' => $nama]);
        }
    }
}
