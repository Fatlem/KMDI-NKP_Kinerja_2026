// ══════════════════════════════════════════════════════════════════
//  NKP Kinerja 2026 — Master Frontend Engine (Backend API Ready)
// ══════════════════════════════════════════════════════════════════

const S = { 
  user: null, 
  page: 'dashboard', 
  riFilter: '', 
  allR: [], 
  picList: [], 
  csrf: '' 
};

let chartBar = null, chartDonut = null;

// Palette warna avatar PIC
const PIC_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#be185d', '#65a30d'];
function picColor(i) { return PIC_COLORS[i % PIC_COLORS.length]; }

// ── Chart.js Center-Text Donut Plugin ─────────────────────────────
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx, chartArea: { width, height, left, top } } = chart;
    ctx.save();
    const data  = chart.data.datasets[0].data;
    const total = data.reduce((a, b) => a + b, 0);
    const pct   = total > 0 ? Math.round((data[0] / total) * 100) : 0;
    const cx = left + width / 2, cy = top + height / 2;
    
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(pct + '%', cx, cy - 6);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Progress Selesai', cx, cy + 12);
    ctx.restore();
  }
};
if (typeof Chart !== 'undefined') {
  Chart.register(centerTextPlugin);
}

// ── INIT ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  S.csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
  refreshIcons();
  loadLoginUsers();
  applyResponsiveMode();
  startClock();

  const p = document.getElementById('lg-pass');
  const u = document.getElementById('lg-user');
  if (p) p.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  if (u) u.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  const btnConf = document.getElementById('btn-conf-ok');
  if (btnConf) {
    btnConf.addEventListener('click', executeDelete);
  }
});

// ── API HELPER ────────────────────────────────────────────────────
async function apiFetch(url, method = 'GET', data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': S.csrf },
    credentials: 'same-origin',
  };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);
  const ct  = res.headers.get('content-type');
  if (!ct || !ct.includes('application/json')) {
    throw new Error('Server error ' + res.status + '. Periksa log Laravel.');
  }
  return res.json();
}

// ── JAM & TANGGAL REALTIME ────────────────────────────────────────
function startClock() {
  const days   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  function tick() {
    const now = new Date();
    const d = document.getElementById('hdr-date');
    const t = document.getElementById('hdr-time');
    if (d) d.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    if (t) t.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
  }
  tick(); 
  setInterval(tick, 20000);
}

// ── VISIBILITAS PASSWORD ─────────────────────────────────────────
function togglePassVis() {
  const inp  = document.getElementById('lg-pass');
  const icon = document.getElementById('pass-eye-icon');
  if (!inp || !icon) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  icon.setAttribute('data-lucide', show ? 'eye-off' : 'eye');
  refreshIcons();
}

// ── RESPONSIVE MODE ──────────────────────────────────────────────
function applyResponsiveMode() {
  const isMobile = window.innerWidth <= 768;
  document.body.classList.toggle('is-mobile', isMobile);
  if (!isMobile) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sb-overlay')?.classList.remove('show');
  }
}
window.addEventListener('resize', applyResponsiveMode);

function refreshIcons() {
  setTimeout(() => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 50);
}

// ══════════════════ LOGIN & AUTH ═════════════════════════════════
function doLogin() {
  const uEl = document.getElementById('lg-user');
  const pEl = document.getElementById('lg-pass');
  const err = document.getElementById('login-err');
  const btn = document.getElementById('btn-login');
  if (!uEl || !pEl || !btn) return;

  const u = uEl.value.trim();
  const p = pEl.value;

  if (err) err.style.display = 'none';
  if (!u || !p) {
    if (err) {
      err.textContent = 'Username dan password wajib diisi.';
      err.style.display = 'block';
    }
    return;
  }

  btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:18px;height:18px;"></i> Signing in...';
  btn.disabled = true;
  refreshIcons();

  apiFetch('/api/auth/login', 'POST', { username: u, password: p })
    .then(res => {
      btn.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px;"></i> Sign In';
      btn.disabled = false;
      refreshIcons();

      if (res && res.success) {
        S.user = res.user;
        enterApp();
      } else {
        if (err) {
          err.textContent = (res && res.message) ? res.message : 'Login gagal. Periksa kembali akun Anda.';
          err.style.display = 'block';
        }
      }
    })
    .catch(e => {
      btn.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px;"></i> Sign In';
      btn.disabled = false;
      refreshIcons();
      if (err) {
        err.textContent = 'Error koneksi server: ' + e.message;
        err.style.display = 'block';
      }
    });
}

function doLogout() {
  apiFetch('/api/auth/logout', 'POST').finally(() => {
    S.user = null;
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-view').style.display = 'flex';
    document.getElementById('lg-user').value = '';
    document.getElementById('lg-pass').value = '';
  });
}

function enterApp() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
  applyResponsiveMode();

  const initial = (S.user.nama || S.user.username || '?').charAt(0).toUpperCase();
  document.getElementById('sb-av').textContent      = initial;
  document.getElementById('sb-uname').textContent   = S.user.nama || S.user.username;
  document.getElementById('sb-urole').textContent   = S.user.role === 'admin' ? 'ADMINISTRATOR' : 'PIC UNIT';
  document.getElementById('hdr-avatar').textContent = initial;

  apiFetch('/api/pic').then(list => {
    S.picList = list || [];
    navigate('dashboard');
  });
}

function loadLoginUsers() {
  const dl = document.getElementById('user-list-options');
  if (!dl) return;
  apiFetch('/api/users/list').then(list => {
    if (!list || !list.length) return;
    dl.innerHTML = list.map(u => `<option value="${u.username}">${u.nama || u.username}${u.role === 'admin' ? ' (Admin)' : ''}</option>`).join('');
  }).catch(() => {});
}

// ══════════════════ NAVIGASI ═════════════════════════════════════
function toggleSidebar(open) {
  document.getElementById('sidebar')?.classList.toggle('open', open);
  document.getElementById('sb-overlay')?.classList.toggle('show', open);
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function navigate(page, arg) {
  toggleSidebar(false);
  S.page = page;

  if (page === 'dashboard') {
    setActiveNav('nav-dashboard');
    loadDashboard();
  } else if (page === 'ruang-isian') {
    setActiveNav('nav-ruang-isian');
    loadRuangIsian(arg || '');
  } else if (page === 'rekap') {
    setActiveNav('nav-rekap');
    loadRekap();
  }
}

// ══════════════════ HELPER STATUS TEMUAN ════════════════════════
function statusOf(r) {
  const out = String(r.Output || '').trim().toLowerCase();
  const rec = String(r.RencanaAksi || '').trim();
  const jad = String(r.JadwalPelaksanaan || '').trim();

  if (out.includes('[selesai]') || (out !== '' && !out.includes('[proses]') && !out.includes('[belum]'))) {
    return { cls: 'pill-ok', lbl: 'Selesai', icon: 'check-circle' };
  }
  if (out.includes('[proses]') || rec !== '' || jad !== '') {
    return { cls: 'pill-prog', lbl: 'Proses', icon: 'clock' };
  }
  return { cls: 'pill-empty', lbl: 'Belum', icon: 'minus-circle' };
}

// ══════════════════ DASHBOARD VIEW ═══════════════════════════════
function loadDashboard() {
  const nama = S.user?.nama || S.user?.username || 'Administrator';
  
  // Menggunakan innerHTML dengan ikon Lucide sparkles modern
  const hdrTitle = document.getElementById('hdr-title');
  if (hdrTitle) {
    hdrTitle.innerHTML = `Selamat Datang, ${esc(nama)} <i data-lucide="sparkles" style="width:18px;height:18px;color:#FFCC00;display:inline-block;vertical-align:middle;margin-left:4px;"></i>`;
  }
  
  document.getElementById('hdr-sub').textContent = 'Pantau dan kelola data kinerja dengan mudah dan cepat.';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = rows || [];
      calculateAndRenderDashboard(rows || []);
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

function _picNormKey(s) { return String(s || '').trim().toLowerCase(); }

function calculateAndRenderDashboard(rows) {
  const picList = S.picList || [];
  const uniqueNos = new Set();
  let totalSelesai = 0, totalProses = 0, totalBelum = 0;
  
  const picStatsMap = {};
  picList.forEach(p => {
    picStatsMap[_picNormKey(p.username)] = { username: p.username, nama: p.nama, jumlah: 0, selesai: 0, progress: 0 };
  });

  rows.forEach(r => {
    if (r.No) uniqueNos.add(String(r.No).trim());
    const st = statusOf(r);
    if (st.lbl === 'Selesai') totalSelesai++;
    else if (st.lbl === 'Proses') totalProses++;
    else totalBelum++;

    const pKey = _picNormKey(r.PIC);
    if (pKey && picStatsMap[pKey]) {
      picStatsMap[pKey].jumlah++;
      if (st.lbl === 'Selesai') picStatsMap[pKey].selesai++;
    }
  });

  const total = rows.length;
  const totalTemuan = uniqueNos.size;
  let picMengisiCount = 0;

  const picStatsArray = Object.keys(picStatsMap).map(k => {
    const item = picStatsMap[k];
    if (item.jumlah > 0) picMengisiCount++;
    item.progress = item.jumlah > 0 ? Math.round((item.selesai / item.jumlah) * 100) : 0;
    return item;
  });

  renderDashboard({
    totalTemuan,
    totalTindakLanjut: total,
    picMengisi: picMengisiCount,
    totalPic: picList.length,
    progressKeseluruhan: total > 0 ? Math.round((totalSelesai / total) * 100) : 0,
    status: { selesai: totalSelesai, proses: totalProses, belum: totalBelum },
    picStats: picStatsArray,
  });
}

function renderDashboard(d) {
  if (!d) return;
  const isPic = S.user && S.user.role === 'pic';
  let picGrid = d.picStats || [];
  if (isPic) picGrid = picGrid.filter(p => p.username === S.user.username);

  const statCards = [
    { label: 'TOTAL TEMUAN', value: d.totalTemuan || 0, icon: 'search', cls: 'blue' },
    { label: 'TOTAL TINDAK LANJUT', value: d.totalTindakLanjut || 0, icon: 'file-text', cls: 'purple' },
    { label: 'PIC SUDAH MENGISI', value: `${d.picMengisi || 0}/${d.totalPic || 0}`, icon: 'user-check', cls: 'green' },
    { label: 'PROGRESS KESELURUHAN', value: `${d.progressKeseluruhan || 0}%`, icon: 'trending-up', cls: 'orange' },
  ];

  setBody(`
    <div class="stat-grid">
      ${statCards.map(c => `
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon-wrap ${c.cls}"><i data-lucide="${c.icon}"></i></div>
            <span class="stat-trend up">↗ 0%</span>
          </div>
          <div class="stat-value">${c.value}</div>
          <div class="stat-label">${c.label}</div>
        </div>
      `).join('')}
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card-header">
          <div class="chart-card-title"><i data-lucide="bar-chart-2"></i> Jumlah Tindak Lanjut per PIC</div>
          <select class="select-custom" style="padding:4px 8px;font-size:11.5px;">
            <option>Tahun 2026</option>
          </select>
        </div>
        <div style="height:210px;position:relative"><canvas id="chart-bar"></canvas></div>
      </div>

      <div class="chart-card">
        <div class="chart-card-header">
          <div class="chart-card-title"><i data-lucide="pie-chart"></i> Status Tindak Lanjut</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;height:210px;">
          <div style="width:55%;height:100%;position:relative;"><canvas id="chart-donut"></canvas></div>
          <div style="width:45%;display:flex;flex-direction:column;gap:10px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px solid #f1f5f9;">
              <span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#10b981;"></span> Selesai</span>
              <b>${d.status.selesai}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding-bottom:6px;border-bottom:1px solid #f1f5f9;">
              <span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></span> Proses</span>
              <b>${d.status.proses}</b>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#cbd5e1;"></span> Belum</span>
              <b>${d.status.belum}</b>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <h3 style="font-size:14.5px;font-weight:800;display:flex;align-items:center;gap:6px;">
        <i data-lucide="users" style="width:18px;color:#2563eb;"></i> ${isPic ? 'Informasi PIC Anda' : 'Daftar Progress PIC'}
      </h3>
      <a href="#" style="font-size:12px;color:#2563eb;font-weight:700;" onclick="navigate('rekap'); return false;">Lihat Semua &gt;</a>
    </div>

    <div class="pic-grid" id="pic-grid"></div>
  `);

  const grid = document.getElementById('pic-grid');
  grid.innerHTML = picGrid.map((p, i) => {
    const clr = picColor(i);
    const init = (p.nama || p.username || '?').charAt(0).toUpperCase();
    return `
      <div class="pic-card" style="border-left-color:${clr}" onclick="navigate('ruang-isian','${p.username.replace(/'/g, "\\'")}')">
        <div class="pic-card-top">
          <div class="pic-avatar" style="background:${clr}">${init}</div>
          <div>
            <div class="pic-name" title="${esc(p.nama)}">${esc(p.nama)}</div>
            <div class="pic-username">@${esc(p.username)}</div>
          </div>
          <i data-lucide="chevron-right" class="pic-chevron"></i>
        </div>
        <div class="pic-footer">
          <span class="pic-tl-label"><i data-lucide="file-text"></i> Tindak Lanjut</span>
          <span class="pic-progress-val" style="color:${clr}">${p.progress}%</span>
        </div>
      </div>`;
  }).join('') || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">Belum ada data PIC</div>';

  refreshIcons();

  if (document.getElementById('chart-bar')) {
    const bctx = document.getElementById('chart-bar').getContext('2d');
    if (chartBar) chartBar.destroy();
    chartBar = new Chart(bctx, {
      type: 'bar',
      data: {
        labels: (d.picStats || []).map(p => p.nama.length > 14 ? p.nama.substring(0, 12) + '...' : p.nama),
        datasets: [{
          label: 'Tindak Lanjut',
          data: (d.picStats || []).map(p => p.jumlah),
          backgroundColor: '#2563eb',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 9.5 }, maxRotation: 20 } },
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  if (document.getElementById('chart-donut')) {
    const dctx = document.getElementById('chart-donut').getContext('2d');
    if (chartDonut) chartDonut.destroy();
    chartDonut = new Chart(dctx, {
      type: 'doughnut',
      data: {
        labels: ['Selesai', 'Proses', 'Belum'],
        datasets: [{
          data: [d.status.selesai, d.status.proses, d.status.belum || (d.totalTindakLanjut === 0 ? 1 : 0)],
          backgroundColor: ['#10b981', '#f59e0b', '#e2e8f0']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { display: false } }
      }
    });
  }
}

// ══════════════════ RUANG ISIAN VIEW ═════════════════════════════
function loadRuangIsian(picFilter) {
  document.getElementById('hdr-title').textContent = 'Ruang Isian';
  document.getElementById('hdr-sub').textContent   = 'Tambah, ubah, atau hapus data tindak lanjut';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = rows || [];
      S.riFilter = picFilter || '';
      renderRuangIsian(rows || []);
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

function renderRuangIsian(rows) {
  const selesai = rows.filter(r => statusOf(r).lbl === 'Selesai').length;
  const progress = rows.length ? Math.round((selesai / rows.length) * 100) : 0;
  const picOpts = S.picList.map(p => `<option value="${p.username}" ${S.riFilter === p.username ? 'selected' : ''}>${p.nama}</option>`).join('');

  setBody(`
    <div class="hero-banner">
      <h2 class="hero-title">Ruang Isian Tindak Lanjut</h2>
      <p class="hero-sub">Kelola administrasi dan dokumen tindak lanjut hasil pemeriksaan BPK RI</p>
    </div>

    <div class="toolbar-wrap">
      <button class="btn-action-pri" onclick="openModal()"><i data-lucide="plus" style="width:16px;"></i> Tambah Temuan Baru</button>
      <select class="select-custom" id="ri-flt-pic" style="width:260px;" onchange="filterRuangIsian()" ${S.user?.role === 'pic' ? 'disabled' : ''}>
        <option value="">Semua PIC</option>
        ${picOpts}
      </select>
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);" id="ri-count"></span>
    </div>

    <div id="entry-list"></div>
  `);

  renderEntryList();
}

function filterRuangIsian() {
  S.riFilter = document.getElementById('ri-flt-pic').value;
  renderEntryList();
}

function renderEntryList() {
  const rows = S.riFilter ? S.allR.filter(r => String(r.PIC).trim() === S.riFilter) : S.allR;
  const list = document.getElementById('entry-list');
  
  if (!rows.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:60px;background:#fff;border-radius:var(--r-xl);border:1.5px dashed var(--border-color);">
        <i data-lucide="folder-open" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:8px;"></i>
        <h4 style="font-weight:700">Belum Ada Data</h4>
        <p style="font-size:12px;color:var(--text-muted)">Klik tombol "+ Tambah Temuan Baru" untuk membuat data baru.</p>
      </div>`;
    refreshIcons();
    return;
  }

  const groups = {};
  rows.forEach(r => {
    const k = String(r.No || '0');
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });

  document.getElementById('ri-count').textContent = `${Object.keys(groups).length} Temuan Utama (${rows.length} Rincian)`;
  
  let html = '';
  Object.keys(groups).forEach(noKey => {
    const items = groups[noKey];
    const parent = items[0];

    html += `
      <div class="entry-card">
        <div class="entry-card-header" onclick="togEntry(this)">
          <div class="entry-badge-no">${parent.No || '-'}</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:14px;color:#0f172a;">${esc(parent.Temuan) || '—'}</div>
            <div style="font-size:11.5px;color:#64748b;margin-top:2px;">PIC: <strong>${esc(parent.PIC)}</strong> (${items.length} Rincian Sub-Tindak Lanjut)</div>
          </div>
          <button class="btn-action-sec" style="padding:6px 12px;font-size:12px;" onclick="event.stopPropagation(); openAddSubModal(${items[items.length - 1]._row})">
            <i data-lucide="plus-circle" style="width:14px;"></i> Tambah Sub
          </button>
        </div>

        <div class="sub-item-block" style="display:none;">
          ${items.map((sub, idx) => {
            const st = statusOf(sub);
            return `
              <div style="background:#fff;padding:14px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                  <strong style="font-size:13px;">Rincian #${idx + 1}${sub.SubTemuan ? '- ' + esc(sub.SubTemuan) : ''}</strong>
                  <div style="display:flex;gap:6px;align-items:center;">
                    <span class="status-pill ${st.cls}">
                      <i data-lucide="${st.icon}" style="width:12px;"></i> ${st.lbl.toUpperCase()}
                    </span>
                    <button class="btn-action-sec" style="padding:4px 8px;" onclick="openModal('${sub.PIC}',${sub._row})"><i data-lucide="edit-3" style="width:13px;"></i></button>
                    <button class="btn-action-sec" style="padding:4px 8px;color:#ef4444;" onclick="confirmDel(${sub._row})"><i data-lucide="trash-2" style="width:13px;"></i></button>
                  </div>
                </div>
                <div class="sub-grid">
                  <div><b>KRITERIA:</b> ${esc(sub.Kriteria) || '-'}</div>
                  <div><b>SEBAB:</b> ${esc(sub.Sebab) || '-'}</div>
                  <div><b>REKOMENDASI:</b> ${esc(sub.Rekomendasi) || '-'}</div>
                  <div><b>RENCANA AKSI:</b> ${esc(sub.RencanaAksi) || '-'}</div>
                  <div><b>JADWAL:</b> ${esc(sub.JadwalPelaksanaan) || '-'}</div>
                  <div><b>OUTPUT:</b> ${esc((sub.Output || '').replace(/\[(selesai\vert{}proses\vert{}belum)\]/gi, '')) || '-'}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  });

  list.innerHTML = html;
  refreshIcons();
}

function togEntry(headerEl) {
  const subBlock = headerEl.nextElementSibling;
  if (subBlock) {
    subBlock.style.display = subBlock.style.display === 'none' ? 'block' : 'none';
  }
}

// ══════════════════ REKAP & LAPORAN VIEW ════════════════════════
function loadRekap() {
  document.getElementById('hdr-title').textContent = 'Rekap & Laporan';
  document.getElementById('hdr-sub').textContent   = 'Tinjauan lengkap data tindak lanjut BPK RI';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan')
    .then(rows => {
      S.allR = rows || [];
      renderRekap(rows || []);
    })
    .catch(() => showToast('Gagal memuat data dari server', 'err'));
}

function renderRekap(rows) {
  const picOpts = S.picList.map(p => `<option value="${p.username}">${p.nama}</option>`).join('');

  setBody(`
    <div class="toolbar-wrap">
      <select class="select-custom" id="flt-pic" style="width:240px;" onchange="filterRekap()"><option value="">Semua PIC</option>${picOpts}</select>
      <input class="input-search" id="flt-q" placeholder="Cari data temuan..." oninput="filterRekap()" style="width:240px">
      <span style="font-size:12px;color:var(--text-muted)" id="flt-count"></span>
      <button class="btn-action-sec" style="margin-left:auto" onclick="exportExcel()"><i data-lucide="download" style="width:16px"></i> Ekspor Excel</button>
    </div>

    <div class="entry-card" style="padding:16px;overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f8fafc;text-align:left;color:#64748b;font-size:11px;font-weight:800;border-bottom:1px solid #e2e8f0;">
            <th style="padding:10px;">NO</th>
            <th style="padding:10px;">PIC</th>
            <th style="padding:10px;">TEMUAN</th>
            <th style="padding:10px;">RINCIAN</th>
            <th style="padding:10px;text-align:right;">AKSI</th>
          </tr>
        </thead>
        <tbody id="rekap-rows"></tbody>
      </table>
    </div>
  `);

  const cont = document.getElementById('rekap-rows');
  if (!rows.length) {
    cont.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">Belum ada data</td></tr>';
    refreshIcons();
    return;
  }

  const groups = {};
  rows.forEach(r => {
    const k = String(r.No || '0');
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });

  cont.innerHTML = Object.keys(groups).map(noKey => {
    const items = groups[noKey];
    const parent = items[0];
    const picObj = S.picList.find(p => p.username === parent.PIC);

    return `
      <tr class="rrow" data-pic="${parent.PIC || ''}" data-q="${esc(parent.Temuan).toLowerCase()}" style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:12px 10px;font-weight:800;color:#2563eb;">${parent.No || '-'}</td>
        <td style="padding:12px 10px;font-weight:700;">${picObj ? esc(picObj.nama) : (parent.PIC || '-')}</td>
        <td style="padding:12px 10px;">${esc(parent.Temuan) || '—'}</td>
        <td style="padding:12px 10px;">${items.length} Detail</td>
        <td style="padding:12px 10px;text-align:right;">
          <button class="btn-action-sec" style="padding:4px 8px;" onclick="openAddSubModal(${items[items.length - 1]._row})">
            <i data-lucide="plus" style="width:14px;"></i> Sub
          </button>
        </td>
      </tr>`;
  }).join('');

  document.getElementById('flt-count').textContent = `${Object.keys(groups).length} Temuan Utama`;
  refreshIcons();
}

function filterRekap() {
  const pf = document.getElementById('flt-pic').value;
  const q  = (document.getElementById('flt-q').value || '').toLowerCase();
  let v = 0;

  document.querySelectorAll('.rrow').forEach(r => {
    const mp = !pf || r.dataset.pic === pf;
    const mq = !q || r.dataset.q.includes(q);
    r.style.display = (mp && mq) ? '' : 'none';
    if (mp && mq) v++;
  });
  document.getElementById('flt-count').textContent = v + ' Data Ditemukan';
}

// ══════════════════ EXPORT TO EXCEL ══════════════════════════════
async function exportExcel() {
  if (!S.allR.length) {
    showToast('Tidak ada data untuk diekspor', 'inf');
    return;
  }
  const btn = document.querySelector('.toolbar-wrap .btn-action-sec');
  const orig = btn ? btn.innerHTML : null;
  if (btn) {
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px"></i> Menyiapkan...';
    btn.disabled = true;
    refreshIcons();
  }

  try {
    const NC = 10;
    const thin = { style: 'thin', color: { argb: 'FF000000' } };
    const border = { top: thin, left: thin, bottom: thin, right: thin };

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('BPK Kinerja');
    
    ws.columns = [
      { width: 6 }, { width: 35 }, { width: 35 }, { width: 25 }, 
      { width: 25 }, { width: 30 }, { width: 25 }, { width: 30 }, 
      { width: 18 }, { width: 25 }
    ];

    [
      'TINDAKLANJUT HASIL PEMERIKSAAN BPK',
      'ATAS SINKRONISASI SISTEM INFORMASI PANGAN TAHUN 2024 S.D SEPTEMBER 2025',
      'DAN KESIAPAN PEMERINTAH MELAKSANAKAN PROGRAM KETAHANAN PANGAN POKOK TERTENTU/STRATEGIS PERIODE 2025-2029'
    ].forEach((t, i) => {
      ws.mergeCells(i + 1, 1, i + 1, NC);
      const c = ws.getCell(i + 1, 1);
      c.value = t;
      c.font = { bold: true, size: 12 };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const hr = ws.getRow(5);
    ['No', 'Temuan', 'Sub Temuan', 'Kriteria', 'Sebab', 'Rekomendasi', 'PIC', 'Rencana Aksi', 'Jadwal Pelaksanaan', 'Output'].forEach((h, i) => {
      const c = hr.getCell(i + 1);
      c.value = h;
      c.font = { bold: true, size: 11 };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      c.border = border;
    });

    const DS = 6;
    S.allR.forEach((r, i) => {
      const row = ws.getRow(DS + i);
      [
        r.No || '', r.Temuan || '', r.SubTemuan || '', r.Kriteria || '',
        r.Sebab || '', r.Rekomendasi || '', r.PIC || '', r.RencanaAksi || '',
        r.JadwalPelaksanaan || '', (r.Output || '').replace(/\[(selesai\vert{}proses\vert{}belum)\]/gi, '').trim()
      ].forEach((val, j) => {
        const c = row.getCell(j + 1);
        c.value = val;
        c.alignment = { vertical: 'top', wrapText: true };
        c.border = border;
      });
    });

    let gs = 0;
    for (let i = 1; i <= S.allR.length; i++) {
      if (i === S.allR.length || String(S.allR[i].No || '') !== String(S.allR[gs].No || '')) {
        if (i - gs > 1) {
          ws.mergeCells(DS + gs, 1, DS + i - 1, 1);
          ws.mergeCells(DS + gs, 2, DS + i - 1, 2);
        }
        gs = i;
      }
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const now = new Date();
    const fname = `NKP_Kinerja_BPK_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.xlsx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('File Excel berhasil diunduh!', 'ok');
  } catch (e) {
    showToast('Gagal ekspor Excel: ' + e.message, 'err');
  } finally {
    if (btn) {
      btn.innerHTML = orig;
      btn.disabled = false;
      refreshIcons();
    }
  }
}

// ══════════════════ MODAL & CRUD API ═════════════════════════════
function openModal(pic, row) {
  const sel = document.getElementById('m-pic');
  sel.innerHTML = '<option value="">— Pilih PIC —</option>' + S.picList.map(p => `<option value="${p.username}">${p.nama}</option>`).join('');

  document.getElementById('m-row').value = '';
  document.getElementById('m-parent-row').value = '';
  document.getElementById('m-is-sub').value = 'false';

  document.getElementById('modal-title').textContent = row ? 'Edit Tindak Lanjut' : 'Tambah Temuan Baru';
  document.getElementById('modal-sub').textContent   = row ? 'Perbarui rincian data tindak lanjut' : 'Lengkapi isian data temuan BPK berikut';

  const temuanInp = document.getElementById('m-temuan');
  temuanInp.readOnly = false;
  temuanInp.style.background = '#f8fafc';

  ['m-no', 'm-temuan', 'm-subtemuan', 'm-kriteria', 'm-sebab', 'm-rekomendasi', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('m-status-select').value = 'proses';
  document.getElementById('modal-bg').classList.add('open');

  if (row) {
    document.getElementById('m-row').value = row;
    const r = S.allR.find(x => String(x._row) === String(row));
    if (r) {
      sel.value = r.PIC || '';
      document.getElementById('m-no').value           = r.No || '';
      document.getElementById('m-temuan').value       = r.Temuan || '';
      document.getElementById('m-subtemuan').value    = r.SubTemuan || '';
      document.getElementById('m-kriteria').value     = r.Kriteria || '';
      document.getElementById('m-sebab').value        = r.Sebab || '';
      document.getElementById('m-rekomendasi').value  = r.Rekomendasi || '';
      document.getElementById('m-rencanaaksi').value  = r.RencanaAksi || '';
      document.getElementById('m-jadwal').value       = r.JadwalPelaksanaan || '';
      document.getElementById('m-output').value       = (r.Output || '').replace(/\[(selesai\vert{}proses\vert{}belum)\]/gi, '').trim();

      const st = statusOf(r);
      document.getElementById('m-status-select').value = st.lbl === 'Selesai' ? 'selesai' : (st.lbl === 'Proses' ? 'proses' : 'belum');
    }
  } else {
    sel.value = pic || '';
    document.getElementById('m-no').value = '...';
    apiFetch('/api/temuan/next-no').then(n => {
      document.getElementById('m-no').value = n;
    });
  }
}

function openAddSubModal(row) {
  const r = S.allR.find(x => String(x._row) === String(row));
  if (!r) return;

  const sel = document.getElementById('m-pic');
  sel.innerHTML = '<option value="">— Pilih PIC —</option>' + S.picList.map(p => `<option value="${p.username}">${p.nama}</option>`).join('');

  document.getElementById('m-row').value = '';
  document.getElementById('m-parent-row').value = row;
  document.getElementById('m-is-sub').value = 'true';

  document.getElementById('modal-title').textContent = 'Tambah Sub/Detail Tindak Lanjut';
  document.getElementById('modal-sub').textContent   = 'Menambahkan rincian untuk Temuan No. ' + r.No;

  document.getElementById('m-no').value = r.No || '';
  const temuanInp = document.getElementById('m-temuan');
  temuanInp.value = r.Temuan || '';
  temuanInp.readOnly = true;
  temuanInp.style.background = '#eef2ff';

  sel.value = r.PIC || '';
  document.getElementById('m-status-select').value = 'proses';

  ['m-subtemuan', 'm-kriteria', 'm-sebab', 'm-rekomendasi', 'm-rencanaaksi', 'm-jadwal', 'm-output'].forEach(id => {
    document.getElementById(id).value = '';
  });

  document.getElementById('modal-bg').classList.add('open');
  refreshIcons();
}

function closeModal() { document.getElementById('modal-bg').classList.remove('open'); }
function closeModalBg(e) { if (e.target === document.getElementById('modal-bg')) closeModal(); }

function saveTemuan() {
  const isSub = document.getElementById('m-is-sub').value === 'true';
  const sel   = document.getElementById('m-status-select').value;
  let raw     = document.getElementById('m-output').value.trim();

  if (sel === 'selesai') raw = raw ? raw + ' [Selesai]' : 'Selesai [Selesai]';
  else if (sel === 'proses') raw = raw ? raw + ' [Proses]' : '[Proses]';
  else raw = raw ? raw + ' [Belum]' : '[Belum]';

  const fd = {
    No: document.getElementById('m-no').value,
    PIC: document.getElementById('m-pic').value,
    Temuan: document.getElementById('m-temuan').value.trim(),
    SubTemuan: document.getElementById('m-subtemuan').value.trim(),
    Kriteria: document.getElementById('m-kriteria').value.trim(),
    Sebab: document.getElementById('m-sebab').value.trim(),
    Rekomendasi: document.getElementById('m-rekomendasi').value.trim(),
    RencanaAksi: document.getElementById('m-rencanaaksi').value.trim(),
    JadwalPelaksanaan: document.getElementById('m-jadwal').value.trim(),
    Output: raw,
    isSubAdd: isSub,
    parentRow: document.getElementById('m-parent-row').value,
  };

  if (!fd.Temuan) { showToast('Uraian Temuan wajib diisi', 'err'); return; }
  if (!fd.PIC) { showToast('PIC wajib dipilih', 'err'); return; }

  const row = document.getElementById('m-row').value;
  const btn = document.querySelector('.modal-footer-area .btn-action-pri');

  if (btn) {
    btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;"></i> Menyimpan...';
    btn.disabled = true;
    refreshIcons();
  }

  const url = row ? '/api/temuan/' + row : '/api/temuan';
  const method = row ? 'PUT' : 'POST';

  apiFetch(url, method, fd)
    .then(res => {
      if (btn) {
        btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Simpan Data';
        btn.disabled = false;
      }
      if (res && res.success) {
        closeModal();
        showToast('Data berhasil disimpan!', 'ok');
        refreshCurrentPage();
      } else {
        showToast((res && res.message) ? res.message : 'Gagal menyimpan data', 'err');
      }
    })
    .catch(e => {
      if (btn) {
        btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Simpan Data';
        btn.disabled = false;
      }
      showToast('Error: ' + e.message, 'err');
    });
}

function refreshCurrentPage() {
  if (S.page === 'ruang-isian') loadRuangIsian(S.riFilter || '');
  else if (S.page === 'rekap') loadRekap();
  else loadDashboard();
}

// ══════════════════ DELETE HANDLING ══════════════════════════════
let _delRow = null;

function confirmDel(row) {
  _delRow = row;
  document.getElementById('conf-bg').classList.add('open');
}

function closeConf() {
  document.getElementById('conf-bg').classList.remove('open');
  _delRow = null;
}

function executeDelete() {
  if (!_delRow) return;
  const row = _delRow;
  closeConf();

  apiFetch('/api/temuan/' + row, 'DELETE')
    .then(res => {
      if (res && res.success) {
        showToast('Data berhasil dihapus', 'ok');
        refreshCurrentPage();
      } else {
        showToast((res && res.message) ? res.message : 'Gagal menghapus data', 'err');
      }
    })
    .catch(e => showToast('Error: ' + e.message, 'err'));
}

// ══════════════════ UTILS & TOAST ════════════════════════════════
function setBody(html) {
  document.getElementById('page-body').innerHTML = html;
}

function loadingHtml() {
  return '<div style="text-align:center;padding:80px;color:var(--text-muted)"><i data-lucide="loader-2" class="spin" style="width:32px;height:32px;margin-bottom:12px;"></i><div style="font-weight:600">Memuat Data...</div></div>';
}

function esc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

function showToast(msg, type = 'inf') {
  const t = document.getElementById('toast');
  if (!t) return;
  const icons = { ok: 'check-circle-2', err: 'alert-circle', inf: 'info' };
  t.innerHTML = `<i data-lucide="${icons[type] || 'info'}" style="width:18px;"></i> <span>${esc(msg)}</span>`;
  t.className = 'toast-msg show';
  refreshIcons();
  
  setTimeout(() => {
    t.className = 'toast-msg';
  }, 3200);
}
