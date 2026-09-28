<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>NKP Kinerja 2026 - Dashboard Monitoring MKDI</title>
  <meta name="theme-color" content="#0a0f24">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- Chart.js, ExcelJS, & Lucide Icons -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>

  <!-- Custom Master Stylesheet -->
  <link rel="stylesheet" href="{{ asset('css/kmdi.css') }}">
</head>
<body>

  <!-- ================================================================= -->
  <!-- 1. LOGIN PAGE VIEW                                                -->
  <!-- ================================================================= -->
  <div id="login-view" class="login-page-wrapper">
    
    <div class="bg-glow bg-glow-top-right"></div>
    <div class="bg-glow bg-glow-bottom-left"></div>

    <div class="login-main-container">
      <div class="login-card-box">
        
        <!-- Left Panel: Form Login -->
        <div class="login-left-panel">
          <div class="login-logo-area">
            <div class="login-logo-icon">
              <i data-lucide="clipboard-check" style="width:22px;height:22px;"></i>
            </div>
            <div class="login-logo-text">
              <h3>NKP Kinerja 2026</h3>
              <p>Dashboard Monitoring</p>
            </div>
          </div>

          <h1 class="login-heading">Selamat Datang!</h1>
          <p class="login-subheading">Silakan masuk ke akun Anda untuk melanjutkan ke sistem monitoring kinerja MKDI.</p>

          <div id="login-err" class="login-err"></div>

          <form id="form-login" onsubmit="event.preventDefault(); doLogin();">
            <div class="form-group">
              <label class="form-label" for="lg-user">Pengguna / User</label>
              <div class="input-wrapper">
                <span class="input-icon-left"><i data-lucide="user-check" style="width:16px;height:16px;"></i></span>
                <input id="lg-user" type="text" class="input-control no-icon-right" placeholder="Ketik atau pilih pengguna..." list="user-list-options" autocomplete="username" required>
                <datalist id="user-list-options"></datalist>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="lg-pass">Password</label>
              <div class="input-wrapper">
                <span class="input-icon-left"><i data-lucide="lock" style="width:16px;height:16px;"></i></span>
                <input id="lg-pass" type="password" class="input-control" placeholder="Masukkan password" autocomplete="current-password" required>
                <button id="pass-eye-btn" class="input-icon-right" type="button" onclick="togglePassVis()" title="Toggle Password">
                  <i id="pass-eye-icon" data-lucide="eye" style="width:16px;height:16px;"></i>
                </button>
              </div>
            </div>

            <div class="login-options">
              <label class="checkbox-label">
                <input type="checkbox" id="remember-me" checked>
                <span>Ingat saya</span>
              </label>
              <a href="#" class="forgot-link" onclick="alert('Silakan hubungi Administrator.'); return false;">Lupa password?</a>
            </div>

            <button id="btn-login" class="btn-login-submit" type="button" onclick="doLogin()">
              <i data-lucide="log-in" style="width:18px;height:18px;"></i>
              <span>Sign In</span>
            </button>
          </form>

          <div class="login-divider">atau</div>
          
          <div class="login-security">
            <i data-lucide="shield-check" style="width:15px;height:15px;color:#10b981;"></i>
            <span>Sistem resmi MKDI &nbsp;|&nbsp; Aman • Terpercaya • Profesional</span>
          </div>
        </div>

        <!-- Right Panel: Modern MKDI Emblem & Building Backdrop -->
        <div class="login-right-panel">
          <div class="rp-bg-overlay"></div>
          
          <!-- MKDI Emblem Diganti dengan Ikon Modern 'landmark' -->
          <div class="rp-bpk-badge">
            <div class="rp-bpk-emblem">
              <i data-lucide="landmark" style="width:20px;height:20px;color:#38bdf8;"></i>
            </div>
            <div class="rp-bpk-text">
              <h4>MKDI</h4>
              <p>Manajemen Kinerja, Data, dan Informasi</p>
            </div>
          </div>

          <div class="rp-headline">
            <h1>Monitoring Kinerja<br><span>Lebih Mudah &amp; Terarah</span></h1>
            <p>Sistem Pemantauan dan Tindak Lanjut Hasil Pemeriksaan MKDI Kementerian Koordinator Bidang Pangan.</p>
          </div>

          <div class="rp-features">
            <div class="rp-feature">
              <div class="rp-feature-icon"><i data-lucide="radio" style="width:18px;height:18px;"></i></div>
              <div class="rp-feature-text">
                <h5>Transparan</h5>
                <p>Data real-time dan akurat</p>
              </div>
            </div>
            <div class="rp-feature">
              <div class="rp-feature-icon"><i data-lucide="git-merge" style="width:18px;height:18px;"></i></div>
              <div class="rp-feature-text">
                <h5>Terintegrasi</h5>
                <p>Semua data dalam satu sistem</p>
              </div>
            </div>
            <div class="rp-feature">
              <div class="rp-feature-icon"><i data-lucide="zap" style="width:18px;height:18px;"></i></div>
              <div class="rp-feature-text">
                <h5>Efisien</h5>
                <p>Mempercepat tindak lanjut</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Feature Highlights Strip -->
      <div class="login-bottom-highlights">
        <div class="highlight-item">
          <div class="highlight-icon"><i data-lucide="monitor" style="width:20px;height:20px;"></i></div>
          <div class="highlight-text">
            <h4>Responsive</h4>
            <p>Optimal di semua perangkat</p>
          </div>
        </div>
        <div class="highlight-item">
          <div class="highlight-icon"><i data-lucide="shield" style="width:20px;height:20px;"></i></div>
          <div class="highlight-text">
            <h4>Aman</h4>
            <p>Dengan sistem keamanan terbaru</p>
          </div>
        </div>
        <div class="highlight-item">
          <div class="highlight-icon"><i data-lucide="sparkles" style="width:20px;height:20px;"></i></div>
          <div class="highlight-text">
            <h4>Modern</h4>
            <p>Desain bersih &amp; profesional</p>
          </div>
        </div>
      </div>

    </div>
  </div>


  <!-- ================================================================= -->
  <!-- 2. MAIN APPLICATION SHELL                                         -->
  <!-- ================================================================= -->
  <div id="app-container" style="display:none;">
    <div class="app-layout">
      <div id="sb-overlay" class="sidebar-overlay" onclick="toggleSidebar(false)"></div>

      <!-- Dark Navy Sidebar -->
      <aside id="sidebar" class="sidebar">
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
          <li id="nav-dashboard" class="nav-item active" onclick="navigate('dashboard')">
            <i data-lucide="layout-dashboard"></i> <span>Dashboard</span>
          </li>
          <li id="nav-ruang-isian" class="nav-item" onclick="navigate('ruang-isian')">
            <i data-lucide="file-edit"></i> <span>Ruang Isian</span>
          </li>
          <li id="nav-rekap" class="nav-item" onclick="navigate('rekap')">
            <i data-lucide="bar-chart-3"></i> <span>Rekap &amp; Laporan</span>
          </li>
        </ul>

        <div class="sidebar-illustration-card">
          <div class="sb-card-icon-wrap">
            <i data-lucide="building-2" style="width:20px;height:20px;"></i>
          </div>
          <div class="sidebar-motto">
            <strong>Bersama Mewujudkan</strong>
            Kinerja yang Lebih Baik
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="user-profile-card">
            <div id="sb-av" class="user-avatar">A</div>
            <div class="user-info">
              <div id="sb-uname" class="user-name">Administrator</div>
              <div id="sb-urole" class="user-role">ADMINISTRATOR</div>
            </div>
            <button class="btn-logout" onclick="doLogout()" title="Keluar">
              <i data-lucide="log-out" style="width:18px;height:18px;"></i>
            </button>
          </div>
          <div class="sidebar-copyright">NKP Kinerja 2026 &copy; 2026</div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <header class="top-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="mobile-hamburger" onclick="toggleSidebar(true)">
              <i data-lucide="menu" style="width:20px;height:20px;"></i>
            </button>
            <div class="header-greeting">
              <!-- Wave Emoji diganti dengan Ikon Vector Sparkles Modern -->
              <h2 id="hdr-title" style="display:flex;align-items:center;gap:6px;">
                Selamat Datang, Administrator
                <i data-lucide="sparkles" style="width:18px;height:18px;color:#2563eb;"></i>
              </h2>
              <p id="hdr-sub">Pantau dan kelola data kinerja dengan mudah dan cepat.</p>
            </div>
          </div>

          <div class="header-actions">
            <div class="header-date-badge">
              <i data-lucide="calendar" style="width:16px;height:16px;"></i>
              <div>
                <span id="hdr-date" class="hdr-date-val">—</span>
                <span id="hdr-time" class="hdr-time-val">—</span>
              </div>
            </div>
            <div class="header-notif" title="Notifikasi">
              <i data-lucide="bell" style="width:18px;height:18px;"></i>
              <span class="notif-dot"></span>
            </div>
            <div id="hdr-avatar" class="header-avatar-btn">A</div>
          </div>
        </header>

        <div id="page-body" class="page-content"></div>
        <footer class="app-footer">NKP Kinerja 2026 &copy; 2026 Badan Pemeriksa Keuangan RI</footer>
      </div>
    </div>
  </div>


  <!-- ================================================================= -->
  <!-- 3. MODALS & TOAST NOTIFICATION                                    -->
  <!-- ================================================================= -->
  <div id="modal-bg" class="modal-backdrop" onclick="closeModalBg(event)">
    <div class="modal-window">
      <div class="modal-header-area">
        <div>
          <div id="modal-title" class="modal-title-text">Tambah Tindak Lanjut</div>
          <div id="modal-sub" style="font-size:12px;color:var(--text-muted)">Isi rincian tindak lanjut hasil pemeriksaan MKDI</div>
        </div>
        <button class="modal-close-btn" onclick="closeModal()"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
      </div>

      <div class="modal-body-area">
        <input type="hidden" id="m-row">
        <input type="hidden" id="m-parent-row">
        <input type="hidden" id="m-is-sub">

        <div class="form-grid-2">
          <div class="form-field">
            <label>No Temuan</label>
            <input id="m-no" type="text" placeholder="Contoh: 1">
          </div>
          <div class="form-field">
            <label>PIC (Penanggung Jawab)</label>
            <select id="m-pic"></select>
          </div>
        </div>

        <div class="form-field">
          <label>Status Progress</label>
          <select id="m-status-select" style="font-weight:700;">
            <option value="proses">🟡 Dalam Proses</option>
            <option value="selesai">🟢 Selesai</option>
            <option value="belum">🔴 Belum Ditindaklanjuti</option>
          </select>
        </div>

        <div class="form-field">
          <label>Uraian Temuan Utama</label>
          <textarea id="m-temuan" placeholder="Uraikan temuan pemeriksaan MKDI..."></textarea>
        </div>

        <div class="form-field">
          <label>Sub / Detail Rincian Temuan</label>
          <textarea id="m-subtemuan" placeholder="Rincian sub temuan tindak lanjut..."></textarea>
        </div>

        <div class="form-grid-2">
          <div class="form-field"><label>Kriteria</label><textarea id="m-kriteria" placeholder="Kriteria/dasar aturan"></textarea></div>
          <div class="form-field"><label>Sebab</label><textarea id="m-sebab" placeholder="Penyebab temuan"></textarea></div>
        </div>

        <div class="form-field"><label>Rekomendasi MKDI</label><textarea id="m-rekomendasi" placeholder="Rekomendasi resmi MKDI"></textarea></div>
        <div class="form-field"><label>Rencana Aksi</label><textarea id="m-rencanaaksi" placeholder="Rencana aksi unit kerja"></textarea></div>

        <div class="form-grid-2">
          <div class="form-field"><label>Jadwal Pelaksanaan</label><input id="m-jadwal" type="text" placeholder="mis. Triwulan II 2026"></div>
          <div class="form-field"><label>Output / Hasil</label><input id="m-output" type="text" placeholder="Dokumen bukti atau hasil"></div>
        </div>
      </div>

      <div class="modal-footer-area">
        <button class="btn-action-sec" onclick="closeModal()">Batal</button>
        <button class="btn-action-pri" onclick="saveTemuan()"><i data-lucide="save" style="width:16px;height:16px;"></i> Simpan Data</button>
      </div>
    </div>
  </div>

  <div id="conf-bg" class="modal-backdrop">
    <div class="confirm-card">
      <div class="confirm-icon-wrap"><i data-lucide="trash-2" style="width:28px;height:28px;"></i></div>
      <h4 style="font-size:16px;font-weight:800;margin-bottom:6px;">Hapus Data Ini?</h4>
      <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:20px;">Tindakan ini akan menghapus rincian tindak lanjut secara permanen.</p>
      <div style="display:flex;gap:10px;">
        <button class="btn-action-sec" style="flex:1" onclick="closeConf()">Batal</button>
        <button id="btn-conf-ok" class="btn-action-pri" style="flex:1;background:#ef4444;box-shadow:0 4px 14px rgba(239,68,68,0.3);">Ya, Hapus</button>
      </div>
    </div>
  </div>

  <div id="toast" class="toast-msg"></div>

  <!-- Custom Master Script -->
  <script src="{{ asset('js/kmdi.js') }}"></script>
</body>
</html>