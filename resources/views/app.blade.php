<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>NKP Kinerja 2026 - Tindak Lanjut Hasil Pemeriksaan BPK</title>

<!-- PWA Meta -->
<meta name="theme-color" content="#0f172a">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="NKP-2026">

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<!-- Libraries -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>

<!-- App CSS -->
<link rel="stylesheet" href="{{ asset('css/kmdi.css') }}">
</head>
<body>

<!-- ══════════ LOGIN VIEW ══════════ -->
<div class="login-page-wrapper" id="login-view">
  <div class="split-login-card">
    <div class="login-left-panel">
      <div class="login-card-title">Sign In</div>
      <div class="lf-err" id="login-err" style="display:none; background:#fef2f2; border:1px solid #fecaca; color:#dc2626; font-size:12.5px; padding:10px 14px; border-radius:10px; margin-bottom:16px;"></div>

      <div class="form-group">
        <label class="form-label">PENGGUNA / USER</label>
        <input id="lg-user" type="text" class="input-control" placeholder="Ketik atau pilih pengguna..." list="user-list-options" autocomplete="username">
        <datalist id="user-list-options"></datalist>
      </div>

      <div class="form-group">
        <label class="form-label">PASSWORD</label>
        <input id="lg-pass" type="password" class="input-control" placeholder="••••••••" autocomplete="current-password">
      </div>

      <button class="btn-login-submit" id="btn-login" type="button" onclick="doLogin()">SIGN IN</button>
    </div>

    <div class="login-right-panel">
      <h2 style="font-size:28px;font-weight:800;margin-bottom:12px;color:#fff;z-index:2;position:relative;">Selamat Datang!</h2>
      <p style="font-size:13.5px;color:#94a3b8;line-height:1.6;max-width:280px;z-index:2;position:relative;">
        Sistem Pemantauan dan Tindak Lanjut Hasil Pemeriksaan BPK Kementerian Koordinator Bidang Pangan.
      </p>
      <div class="panel-wave">
        <svg viewBox="0 0 500 150" preserveAspectRatio="none">
          <path d="M0,40 C180,100 320,10 500,60 L500,150 L0,150 Z" fill="#334155" opacity="0.3"></path>
          <path d="M0,60 C150,110 350,30 500,80 L500,150 L0,150 Z" fill="#1e293b" opacity="0.5"></path>
          <path d="M0,90 C200,140 380,60 500,100 L500,150 L0,150 Z" fill="#0f172a" opacity="0.8"></path>
        </svg>
      </div>
    </div>
  </div>
</div>

<!-- ══════════ APP SHELL ══════════ -->
<div id="app-container">
  <div class="app-layout">
    <div class="sidebar-overlay" id="sb-overlay" onclick="toggleSidebar(false)"></div>

    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <i data-lucide="clipboard-check" style="width:22px;height:22px;"></i>
        </div>
        <div>
          <div class="sidebar-brand-name">NKP Kinerja 2026</div>
          <div class="sidebar-brand-sub">Dashboard Monitoring</div>
        </div>
      </div>

      <ul class="sidebar-nav">
        <div class="nav-section-title">Menu Utama</div>
        <li class="nav-item" id="nav-dashboard" onclick="navigate('dashboard')">
          <i data-lucide="layout-dashboard"></i> Dashboard
        </li>
        <li class="nav-item" id="nav-ruang-isian" onclick="navigate('ruang-isian')">
          <i data-lucide="file-edit"></i> Ruang Isian
        </li>
        <li class="nav-item" id="nav-rekap" onclick="navigate('rekap')">
          <i data-lucide="bar-chart-3"></i> Rekap &amp; Laporan
        </li>
      </ul>

      <div class="sidebar-footer">
        <div class="user-profile-card">
          <div class="user-avatar" id="sb-av">?</div>
          <div class="user-info">
            <div class="user-name" id="sb-uname">-</div>
            <div class="user-role" id="sb-urole">-</div>
          </div>
          <button class="btn-logout" onclick="doLogout()" title="Keluar">
            <i data-lucide="log-out" style="width:18px;height:18px;"></i>
          </button>
        </div>
      </div>
    </aside>

    <div class="main-wrapper">
      <header class="top-header">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="mobile-hamburger" onclick="toggleSidebar(true)">
            <i data-lucide="menu" style="width:20px;height:20px;"></i>
          </button>
          <div>
            <div class="header-page-title" id="hdr-title">Dashboard</div>
            <div class="header-page-sub" id="hdr-sub">Ringkasan tindak lanjut hasil pemeriksaan BPK</div>
          </div>
        </div>
      </header>

      <div class="page-content" id="page-body"></div>
    </div>
  </div>
</div>

<!-- ══════════ MODAL FORM UTAMA ══════════ -->
<div class="modal-backdrop" id="modal-bg" onclick="closeModalBg(event)">
  <div class="modal-window">
    <div class="modal-header-area">
      <div>
        <div class="modal-title-text" id="modal-title">Tambah Tindak Lanjut</div>
        <div style="font-size:12px;color:var(--text-muted)" id="modal-sub"></div>
      </div>
      <button class="modal-close-btn" onclick="closeModal()"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
    </div>
    <div class="modal-body-area">
      <input type="hidden" id="m-row">
      <input type="hidden" id="m-parent-row">
      <input type="hidden" id="m-is-sub">
      <div class="form-grid-2">
        <div class="form-field">
          <label>No Temuan <span style="text-transform:none;color:#94a3b8">(Otomatis)</span></label>
          <input id="m-no" type="text" readonly style="background:#eef2ff;font-weight:700;color:#2563eb;">
        </div>
        <div class="form-field">
          <label>PIC (Penanggung Jawab)</label>
          <select id="m-pic"></select>
        </div>
      </div>
      <div class="form-field">
        <label>Status Progress</label>
        <select id="m-status-select" style="font-weight:700;">
          <option value="belum">🔴 Belum Ditindaklanjuti</option>
          <option value="proses">🟡 Dalam Proses</option>
          <option value="selesai">🟢 Selesai</option>
        </select>
      </div>
      <div class="form-field">
        <label>Uraian Temuan</label>
        <textarea id="m-temuan" placeholder="Uraian temuan BPK"></textarea>
      </div>
      <div class="form-field">
        <label>Sub Temuan <span style="text-transform:none;color:#94a3b8">(Opsional)</span></label>
        <textarea id="m-subtemuan" placeholder="Detail sub temuan"></textarea>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label>Kriteria</label>
          <textarea id="m-kriteria" placeholder="Kriteria/dasar aturan"></textarea>
        </div>
        <div class="form-field">
          <label>Sebab</label>
          <textarea id="m-sebab" placeholder="Penyebab temuan"></textarea>
        </div>
      </div>
      <div class="form-field">
        <label>Rekomendasi</label>
        <textarea id="m-rekomendasi" placeholder="Rekomendasi BPK"></textarea>
      </div>
      <div class="form-field">
        <label>Rencana Aksi</label>
        <textarea id="m-rencanaaksi" placeholder="Rencana aksi tindak lanjut"></textarea>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label>Jadwal Pelaksanaan</label>
          <input id="m-jadwal" type="text" placeholder="mis. Triwulan I 2026">
        </div>
        <div class="form-field">
          <label>Output / Hasil</label>
          <input id="m-output" type="text" placeholder="Detail dokumen/output hasil">
        </div>
      </div>
    </div>
    <div class="modal-footer-area">
      <button class="btn-action-sec" onclick="closeModal()">Batal</button>
      <button class="btn-action-pri" onclick="saveTemuan()"><i data-lucide="save" style="width:16px;height:16px;"></i> Simpan Data</button>
    </div>
  </div>
</div>

<!-- ══════════ CONFIRM DIALOG ══════════ -->
<div class="modal-backdrop" id="conf-bg">
  <div class="confirm-card">
    <div class="confirm-icon-wrap">
      <i data-lucide="trash-2" style="width:28px;height:28px;"></i>
    </div>
    <h4 style="font-size:16px;font-weight:800;margin-bottom:6px;">Hapus Data Ini?</h4>
    <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:20px;">Tindakan ini tidak dapat dibatalkan kembali.</p>
    <div style="display:flex;gap:10px;">
      <button class="btn-action-sec" style="flex:1" onclick="closeConf()">Batal</button>
      <button class="btn-action-pri" style="flex:1;background:#ef4444;" id="btn-conf-ok">Hapus</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div class="toast-msg" id="toast"></div>

<!-- App JS -->
<script src="{{ asset('js/kmdi.js') }}"></script>
</body>
</html>
