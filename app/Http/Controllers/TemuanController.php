<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Temuan;

class TemuanController extends Controller
{
    // ── GET /api/temuan ───────────────────────────────────────────
    public function index()
    {
        $rows = Temuan::orderBy('sort_order')->orderBy('id')->get();

        // Propagasi No & Temuan dari parent ke sub-baris (sama seperti GAS getAllTemuan)
        $lastNo     = '';
        $lastTemuan = '';

        $data = $rows->map(function ($r) use (&$lastNo, &$lastTemuan) {
            $rawNo     = $r->no     ?? '';
            $rawTemuan = $r->temuan ?? '';

            if ($rawNo)     $lastNo     = $rawNo;
            if ($rawTemuan) $lastTemuan = $rawTemuan;

            return [
                '_row'               => $r->id,
                'No'                 => $rawNo     ?: $lastNo,
                'Temuan'             => $rawTemuan ?: $lastTemuan,
                'SubTemuan'          => $r->sub_temuan          ?? '',
                'Kriteria'           => $r->kriteria            ?? '',
                'Sebab'              => $r->sebab               ?? '',
                'Rekomendasi'        => $r->rekomendasi         ?? '',
                'PIC'                => $r->pic                 ?? '',
                'RencanaAksi'        => $r->rencana_aksi        ?? '',
                'JadwalPelaksanaan'  => $r->jadwal_pelaksanaan  ?? '',
                'Output'             => $r->output              ?? '',
                'isSubRow'           => ($r->parent_id !== null),
            ];
        });

        return response()->json($data->values());
    }

    // ── GET /api/temuan/next-no ───────────────────────────────────
    public function nextNo()
    {
        $max = Temuan::whereNotNull('no')
            ->selectRaw('MAX(CAST(no AS UNSIGNED)) as max_no')
            ->value('max_no');

        return response()->json(($max ?? 0) + 1);
    }

    // ── POST /api/temuan ──────────────────────────────────────────
    public function store(Request $request)
    {
        $fd      = $request->all();
        $isSub   = filter_var($fd['isSubAdd'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $parentId = $fd['parentRow'] ?? null;

        // Tentukan sort_order: sub di-insert tepat setelah parent
        $sortOrder = $this->resolveSort($isSub ? $parentId : null);

        $temuan = Temuan::create([
            'no'                  => $isSub ? null : ($fd['No']     ?? null),
            'temuan'              => $isSub ? null : ($fd['Temuan']  ?? null),
            'sub_temuan'          => $fd['SubTemuan']         ?? null,
            'kriteria'            => $fd['Kriteria']          ?? null,
            'sebab'               => $fd['Sebab']             ?? null,
            'rekomendasi'         => $fd['Rekomendasi']       ?? null,
            'pic'                 => $fd['PIC']               ?? null,
            'rencana_aksi'        => $fd['RencanaAksi']       ?? null,
            'jadwal_pelaksanaan'  => $fd['JadwalPelaksanaan'] ?? null,
            'output'              => $fd['Output']            ?? null,
            'parent_id'           => $isSub ? $parentId : null,
            'sort_order'          => $sortOrder,
        ]);

        return response()->json(['success' => true, 'row' => $temuan->id, 'no' => $temuan->no]);
    }

    // ── PUT /api/temuan/{id} ──────────────────────────────────────
    public function update(Request $request, int $id)
    {
        $temuan = Temuan::find($id);
        if (! $temuan) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        $fd = $request->all();
        $temuan->update([
            'no'                  => $fd['No']               ?? $temuan->no,
            'temuan'              => $fd['Temuan']            ?? $temuan->temuan,
            'sub_temuan'          => $fd['SubTemuan']         ?? null,
            'kriteria'            => $fd['Kriteria']          ?? null,
            'sebab'               => $fd['Sebab']             ?? null,
            'rekomendasi'         => $fd['Rekomendasi']       ?? null,
            'pic'                 => $fd['PIC']               ?? null,
            'rencana_aksi'        => $fd['RencanaAksi']       ?? null,
            'jadwal_pelaksanaan'  => $fd['JadwalPelaksanaan'] ?? null,
            'output'              => $fd['Output']            ?? null,
        ]);

        return response()->json(['success' => true]);
    }

    // ── DELETE /api/temuan/{id} ───────────────────────────────────
    public function destroy(int $id)
    {
        $temuan = Temuan::find($id);
        if (! $temuan) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan.'], 404);
        }

        $temuan->delete();
        return response()->json(['success' => true]);
    }

    // ── Helper ────────────────────────────────────────────────────
    /**
     * Hitung sort_order agar sub-baris muncul tepat setelah parent-nya.
     * Tanpa parentId → append di akhir.
     */
    private function resolveSort(?int $parentId): int
    {
        if (! $parentId) {
            return (Temuan::max('sort_order') ?? 0) + 10;
        }

        $parent     = Temuan::find($parentId);
        $baseOrder  = $parent?->sort_order ?? 0;

        // Geser baris-baris di bawah parent agar ada ruang
        Temuan::where('sort_order', '>', $baseOrder)->increment('sort_order', 10);

        return $baseOrder + 5;
    }
}
