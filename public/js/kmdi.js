// ── STATE ────────────────────────────────────────────────────────
const S = { user: null, page: 'dashboard', riFilter: '', allR: [], picList: [], csrf: '' };
let chartBar = null, chartDonut = null;

// ── INIT ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Ambil CSRF token dari meta tag (diisi Blade)
  S.csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

  if (typeof lucide !== 'undefined') lucide.createIcons();
  loadLoginUsers();
  applyResponsiveMode();

  const passInput = document.getElementById('lg-pass');
  const userInput = document.getElementById('lg-user');
  if (passInput) passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  if (userInput) userInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});

// ── API HELPER ───────────────────────────────────────────────────
async function apiFetch(url, method = 'GET', data = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': S.csrf },
    credentials: 'same-origin',
  };
  if (data) opts.body = JSON.stringify(data);
  const res  = await fetch(url, opts);
  const json = await res.json();
  return json;
}

// ── RESPONSIVE ───────────────────────────────────────────────────
function applyResponsiveMode() {
  const isMobile = window.innerWidth <= 768;
  document.body.classList.toggle('is-mobile', isMobile);
  if (!isMobile) {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sb-overlay')?.classList.remove('show');
  }
}
window.addEventListener('resize', applyResponsiveMode);
window.addEventListener('orientationchange', applyResponsiveMode);

function refreshIcons() {
  setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
}

// ══════════════════ LOGIN ════════════════════════════════════════
function doLogin() {
  const uEl = document.getElementById('lg-user');
  const pEl = document.getElementById('lg-pass');
  const err = document.getElementById('login-err');
  const btn = document.getElementById('btn-login');
  if (!uEl || !pEl || !btn) return;

  const u = uEl.value.trim(), p = pEl.value;
  if (err) err.style.display = 'none';
  if (!u || !p) {
    if (err) { err.textContent = 'Username dan password wajib diisi'; err.style.display = 'block'; }
    return;
  }

  btn.innerHTML = 'SIGNING IN...';
  btn.disabled  = true;

  apiFetch('/api/auth/login', 'POST', { username: u, password: p })
    .then(res => {
      btn.innerHTML = 'SIGN IN';
      btn.disabled  = false;
      if (res && res.success) {
        S.user = res.user;
        enterApp();
      } else {
        if (err) { err.textContent = (res && res.message) ? res.message : 'Login gagal.'; err.style.display = 'block'; }
      }
    })
    .catch(e => {
      btn.innerHTML = 'SIGN IN';
      btn.disabled  = false;
      if (err) { err.textContent = 'Error: ' + e.message; err.style.display = 'block'; }
    });
}

function doLogout() {
  apiFetch('/api/auth/logout', 'POST').finally(() => {
    S.user = null;
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-view').style.display    = 'flex';
    document.getElementById('lg-user').value = '';
    document.getElementById('lg-pass').value = '';
  });
}

function enterApp() {
  document.getElementById('login-view').style.display    = 'none';
  document.getElementById('app-container').style.display = 'block';
  applyResponsiveMode();
  document.getElementById('sb-av').textContent    = (S.user.nama || S.user.username || '?').charAt(0).toUpperCase();
  document.getElementById('sb-uname').textContent = S.user.nama || S.user.username;
  document.getElementById('sb-urole').textContent = S.user.role === 'admin' ? 'Administrator' : 'PIC';

  apiFetch('/api/pic').then(list => {
    S.picList = list || [];
    navigate('dashboard');
  });
}

function loadLoginUsers() {
  const datalist = document.getElementById('user-list-options');
  if (!datalist) return;
  apiFetch('/api/users/list').then(list => {
    if (!list || !list.length) return;
    datalist.innerHTML = list.map(u =>
      `<option value="${u.username}">${u.nama || u.username}${u.role === 'admin' ? ' (Admin)' : ''}</option>`
    ).join('');
  }).catch(() => {});
}

// ══════════════════ NAVIGATION ═══════════════════════════════════
function toggleSidebar(open) {
  document.getElementById('sidebar').classList.toggle('open', open);
  document.getElementById('sb-overlay').classList.toggle('show', open);
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function navigate(page, arg) {
  toggleSidebar(false);
  S.page = page;
  if      (page === 'dashboard')   { setActiveNav('nav-dashboard');   loadDashboard(); }
  else if (page === 'ruang-isian') { setActiveNav('nav-ruang-isian'); loadRuangIsian(arg || ''); }
  else if (page === 'rekap')       { setActiveNav('nav-rekap');        loadRekap(); }
}

// ══════════════════ HELPER STATUS ════════════════════════════════
function statusOf(r) {
  const out = String(r.Output || '').trim().toLowerCase();
  const rec = String(r.RencanaAksi || '').trim();
  const jad = String(r.JadwalPelaksanaan || '').trim();
  if (out.includes('[selesai]') || (out !== '' && !out.includes('[proses]') && !out.includes('[belum]')))
    return { cls: 'pill-ok',    lbl: 'Selesai', icon: 'check-circle' };
  if (out.includes('[proses]') || rec !== '' || jad !== '')
    return { cls: 'pill-prog',  lbl: 'Proses',  icon: 'clock' };
  return   { cls: 'pill-empty', lbl: 'Belum',   icon: 'minus-circle' };
}

// ══════════════════ DASHBOARD ════════════════════════════════════
function loadDashboard() {
  document.getElementById('hdr-title').textContent = 'Dashboard';
  document.getElementById('hdr-sub').textContent   = 'Ringkasan tindak lanjut hasil pemeriksaan BPK';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan').then(rows => {
    S.allR = rows || [];
    calculateAndRenderDashboard(rows || []);
  }).catch(() => showToast('Gagal memuat data', 'err'));
}

function _picNormKey(s) { return String(s || '').trim().toLowerCase(); }

function calculateAndRenderDashboard(rows) {
  const picList  = S.picList || [];
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

  const totalTindakLanjut = rows.length;
  const totalTemuan       = uniqueNos.size;
  let picMengisiCount = 0;
  const picStatsArray = Object.keys(picStatsMap).map(k => {
    const item = picStatsMap[k];
    if (item.jumlah > 0) picMengisiCount++;
    item.progress = item.jumlah > 0 ? Math.round((item.selesai / item.jumlah) * 100) : 0;
    return item;
  });

  renderDashboard({
    totalTemuan, totalTindakLanjut,
    picMengisi: picMengisiCount, totalPic: picList.length,
    progressKeseluruhan: totalTindakLanjut > 0 ? Math.round((totalSelesai / totalTindakLanjut) * 100) : 0,
    status: { selesai: totalSelesai, proses: totalProses, belum: totalBelum },
    picStats: picStatsArray,
  });
}

function renderDashboard(d) {
  if (!d) return;
  const isPic    = S.user && S.user.role === 'pic';
  let picGrid    = d.picStats || [];
  if (isPic) picGrid = picGrid.filter(p => p.username === S.user.username);

  setBody(`
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-header"><span class="stat-label">TOTAL TEMUAN</span><div class="stat-icon" style="background:#eff6ff;color:#2563eb"><i data-lucide="search"></i></div></div><div class="stat-value">${d.totalTemuan || 0}</div></div>
      <div class="stat-card"><div class="stat-header"><span class="stat-label">TOTAL TINDAK LANJUT</span><div class="stat-icon" style="background:#f5f3ff;color:#7c3aed"><i data-lucide="file-text"></i></div></div><div class="stat-value">${d.totalTindakLanjut || 0}</div></div>
      <div class="stat-card"><div class="stat-header"><span class="stat-label">PIC SUDAH MENGISI</span><div class="stat-icon" style="background:#ecfdf5;color:#059669"><i data-lucide="users"></i></div></div><div class="stat-value">${d.picMengisi || 0}/${d.totalPic || 0}</div></div>
      <div class="stat-card"><div class="stat-header"><span class="stat-label">PROGRESS KESELURUHAN</span><div class="stat-icon" style="background:#fffbeb;color:#d97706"><i data-lucide="trending-up"></i></div></div><div class="stat-value">${d.progressKeseluruhan || 0}%</div></div>
    </div>
    <div class="chart-grid">
      <div class="chart-card"><div class="chart-title"><i data-lucide="bar-chart-2" style="width:18px"></i> Jumlah Tindak Lanjut per PIC</div><div style="height:220px;position:relative"><canvas id="chart-bar"></canvas></div></div>
      <div class="chart-card"><div class="chart-title"><i data-lucide="pie-chart" style="width:18px"></i> Status Tindak Lanjut</div><div style="height:220px;position:relative"><canvas id="chart-donut"></canvas></div></div>
    </div>
    <div style="font-size:15px;font-weight:800;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
      <i data-lucide="user-check" style="width:20px"></i> ${isPic ? 'Informasi PIC Anda' : 'Daftar Progress PIC'}
    </div>
    <div class="pic-grid" id="pic-grid"></div>
  `);

  document.getElementById('pic-grid').innerHTML = picGrid.map(p => `
    <div class="pic-card" onclick="navigate('ruang-isian','${p.username.replace(/'/g,"\\'")}')">
      <div class="pic-name">${p.nama}</div>
      <div class="pic-username">@${p.username}</div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:4px"><span>${p.jumlah} Tindak Lanjut</span><span style="font-weight:700;color:#2563eb">${p.progress}%</span></div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${p.progress}%"></div></div>
    </div>`).join('') || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">Belum ada data PIC</div>';

  refreshIcons();

  if (document.getElementById('chart-bar')) {
    const bctx = document.getElementById('chart-bar').getContext('2d');
    if (chartBar) chartBar.destroy();
    chartBar = new Chart(bctx, {
      type: 'bar',
      data: { labels: (d.picStats || []).map(p => p.nama || p.username), datasets: [{ label: 'Jumlah', data: (d.picStats || []).map(p => p.jumlah), backgroundColor: '#2563eb', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });
  }
  if (document.getElementById('chart-donut')) {
    const dctx = document.getElementById('chart-donut').getContext('2d');
    if (chartDonut) chartDonut.destroy();
    chartDonut = new Chart(dctx, {
      type: 'doughnut',
      data: { labels: ['Selesai','Proses','Belum'], datasets: [{ data: [d.status.selesai, d.status.proses, d.status.belum], backgroundColor: ['#10b981','#f59e0b','#cbd5e1'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    });
  }
}

// ══════════════════ RUANG ISIAN ══════════════════════════════════
function loadRuangIsian(picFilter) {
  document.getElementById('hdr-title').textContent = 'Ruang Isian';
  document.getElementById('hdr-sub').textContent   = 'Tambah, ubah, atau hapus data tindak lanjut';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan').then(rows => {
    S.allR     = rows || [];
    S.riFilter = picFilter || '';
    renderRuangIsian(rows || []);
  }).catch(() => showToast('Gagal memuat data', 'err'));
}

function renderRuangIsian(rows) {
  const selesai  = rows.filter(r => statusOf(r).lbl === 'Selesai').length;
  const progress = rows.length ? Math.round(selesai / rows.length * 100) : 0;
  const picOpts  = S.picList.map(p => `<option value="${p.username}" ${S.riFilter === p.username ? 'selected' : ''}>${p.nama}</option>`).join('');

  setBody(`
    <div class="hero-banner">
      <div class="hero-title">Ruang Isian Tindak Lanjut</div>
      <div class="hero-sub">Pengelolaan berkas dan administrasi hasil pemeriksaan BPK</div>
      <div class="hero-stats-row">
        <div class="hero-stat-item"><b>${rows.length}</b><span>Total Item</span></div>
        <div class="hero-stat-item"><b>${selesai}</b><span>Selesai</span></div>
        <div class="hero-stat-item"><b>${progress}%</b><span>Progress</span></div>
      </div>
    </div>
    <div class="toolbar-wrap">
      <button class="btn-action-pri" onclick="openModal()"><i data-lucide="plus"></i> Tambah Temuan Baru</button>
      <select class="select-custom" id="ri-flt-pic" onchange="filterRuangIsian()"><option value="">Semua PIC</option>${picOpts}</select>
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);" id="ri-count"></span>
    </div>
    <div id="entry-list"></div>
  `);
  renderEntryList();
}

function filterRuangIsian() { S.riFilter = document.getElementById('ri-flt-pic').value; renderEntryList(); }

function renderEntryList() {
  const rows = S.riFilter ? S.allR.filter(r => String(r.PIC).trim() === S.riFilter) : S.allR;
  const list = document.getElementById('entry-list');

  if (!rows.length) {
    list.innerHTML = '<div style="text-align:center;padding:60px;background:#fff;border-radius:var(--radius-lg);border:1px dashed var(--border-color);"><i data-lucide="folder-open" style="width:40px;height:40px;color:var(--text-muted);margin-bottom:8px;"></i><h4 style="font-weight:700">Belum ada data</h4><p style="font-size:12px;color:var(--text-muted)">Klik "+ Tambah Temuan Baru" untuk membuat baru.</p></div>';
    refreshIcons(); return;
  }

  const groups = {};
  rows.forEach(r => { const key = String(r.No || '0'); if (!groups[key]) groups[key] = []; groups[key].push(r); });

  document.getElementById('ri-count').textContent = Object.keys(groups).length + ' Temuan Utama (' + rows.length + ' Detail Rincian)';

  let html = '';
  Object.keys(groups).forEach(noKey => {
    const items      = groups[noKey];
    const parentItem = items[0];
    html += `
      <div class="entry-card">
        <div class="entry-card-header" onclick="togEntry(this)">
          <div class="entry-badge-no">${parentItem.No || '-'}</div>
          <div class="entry-main-content">
            <div class="entry-title-text">${esc(parentItem.Temuan) || "—"}</div>
            <div class="entry-sub-text">Total ${items.length} Rincian Sub-Tindak Lanjut</div>
          </div>
          <div class="action-btn-group" onclick="event.stopPropagation()">
            <button class="icon-btn primary-btn" onclick="openAddSubModal(${items[items.length - 1]._row})" title="Tambah Detail / Sub Tindak Lanjut">
              <i data-lucide="plus-circle" style="width:16px;"></i>
            </button>
          </div>
        </div>
        <div class="entry-card-body" style="display:none">
          ${items.map((sub, idx) => {
            const st     = statusOf(sub);
            const picObj = S.picList.find(p => p.username === sub.PIC);
            return `
              <div class="sub-item-block">
                <div class="sub-item-header">
                  <span class="sub-title">Rincian #${idx + 1}${sub.SubTemuan ? ' - ' + esc(sub.SubTemuan) : ''}</span>
                  <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-size:11px;font-weight:700;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:12px;">
                      PIC: ${esc(picObj ? picObj.nama : sub.PIC) || "Belum ditentukan"}
                    </span>
                    <span class="status-pill ${st.cls}"><i data-lucide="${st.icon}" style="width:12px;height:12px;"></i> ${st.lbl}</span>
                    <button class="icon-btn" onclick="openModal('${sub.PIC}',${sub._row})" title="Edit"><i data-lucide="edit-3" style="width:14px;"></i></button>
                    <button class="icon-btn danger" onclick="confirmDel(${sub._row})" title="Hapus"><i data-lucide="trash-2" style="width:14px;"></i></button>
                  </div>
                </div>
                <div class="sub-grid">
                  <div><div class="detail-label">Kriteria</div><div>${esc(sub.Kriteria) || "—"}</div></div>
                  <div><div class="detail-label">Sebab</div><div>${esc(sub.Sebab) || "—"}</div></div>
                  <div><div class="detail-label">Rekomendasi</div><div>${esc(sub.Rekomendasi) || "—"}</div></div>
                  <div><div class="detail-label">Rencana Aksi</div><div>${esc(sub.RencanaAksi) || "—"}</div></div>
                  <div><div class="detail-label">Jadwal Pelaksanaan</div><div>${esc(sub.JadwalPelaksanaan) || "—"}</div></div>
                  <div><div class="detail-label">Output / Hasil</div><div>${esc((sub.Output || '').replace(/\[(selesai|proses|belum)\]/gi, '')) || "—"}</div></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  });

  list.innerHTML = html;
  refreshIcons();
}

function togEntry(top) { const d = top.nextElementSibling; if (d) d.style.display = d.style.display === 'none' ? 'block' : 'none'; }

// ══════════════════ REKAP & LAPORAN ══════════════════════════════
function loadRekap() {
  document.getElementById('hdr-title').textContent = 'Rekap & Laporan';
  document.getElementById('hdr-sub').textContent   = 'Tinjauan lengkap data tindak lanjut BPK';
  setBody(loadingHtml());
  refreshIcons();

  apiFetch('/api/temuan').then(rows => {
    S.allR = rows || [];
    renderRekap(rows || []);
  }).catch(() => showToast('Gagal memuat data', 'err'));
}

function renderRekap(rows) {
  const picOpts = S.picList.map(p => `<option value="${p.username}">${p.nama}</option>`).join('');
  setBody(`
    <div class="toolbar-wrap">
      <select class="select-custom" id="flt-pic" onchange="filterRekap()"><option value="">Semua PIC</option>${picOpts}</select>
      <input class="input-search" id="flt-q" placeholder="Cari data temuan..." oninput="filterRekap()" style="width:240px">
      <span style="font-size:12px;color:var(--text-muted)" id="flt-count"></span>
      <button class="btn-action-sec" style="margin-left:auto" onclick="exportExcel()"><i data-lucide="download" style="width:16px"></i> Ekspor Excel</button>
    </div>
    <div class="table-container">
      <div class="table-head-row"><div>No</div><div>PIC</div><div>Temuan</div><div>Status</div><div>Aksi</div></div>
      <div id="rekap-rows"></div>
    </div>
  `);

  const cont = document.getElementById('rekap-rows');
  if (!rows.length) { cont.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Belum ada data</div>'; refreshIcons(); return; }

  const groups = {};
  rows.forEach(r => { const key = String(r.No || '0'); if (!groups[key]) groups[key] = []; groups[key].push(r); });

  cont.innerHTML = Object.keys(groups).map(noKey => {
    const items  = groups[noKey];
    const parent = items[0];
    const picObj = S.picList.find(p => p.username === parent.PIC);
    const completedCount = items.filter(sub => statusOf(sub).lbl === 'Selesai').length;
    let overallSt = { cls: 'pill-prog', lbl: 'Proses (' + completedCount + '/' + items.length + ')', icon: 'clock' };
    if (completedCount === items.length) overallSt = { cls: 'pill-ok',    lbl: 'Selesai', icon: 'check-circle' };
    else if (completedCount === 0 && !items.some(sub => statusOf(sub).lbl === 'Proses'))
      overallSt = { cls: 'pill-empty', lbl: 'Belum', icon: 'minus-circle' };

    return `<div class="table-data-row rrow" data-pic="${parent.PIC || ''}" data-q="${esc(parent.Temuan).toLowerCase()}">
      <div class="table-data-main" onclick="togRekap(this)">
        <div style="font-weight:800;font-size:12px;color:var(--text-muted)">${parent.No || '-'}</div>
        <div style="font-weight:700;font-size:13px">${picObj ? picObj.nama : (parent.PIC || '-')}</div>
        <div style="font-weight:700;font-size:13px;color:var(--text-main);padding-right:12px;">
          ${esc(parent.Temuan) || "—"}
          <div style="font-size:11.5px;color:var(--text-muted);font-weight:500;margin-top:2px;">Total ${items.length} Detail Sub-Tindak Lanjut</div>
        </div>
        <div><span class="status-pill ${overallSt.cls}"><i data-lucide="${overallSt.icon}" style="width:12px;"></i> ${overallSt.lbl}</span></div>
        <div class="action-btn-group" onclick="event.stopPropagation()">
          <button class="icon-btn primary-btn" onclick="openAddSubModal(${items[items.length - 1]._row})" title="Tambah Detail"><i data-lucide="plus-circle" style="width:14px"></i></button>
        </div>
      </div>
      <div class="entry-card-body" style="display:none;padding:16px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        ${items.map((sub, idx) => {
          const st = statusOf(sub);
          return `<div style="background:#fff;padding:12px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <b>Rincian #${idx + 1}: ${esc(sub.SubTemuan) || "—"}</b>
              <div style="display:flex;gap:6px;align-items:center;">
                <span class="status-pill ${st.cls}"><i data-lucide="${st.icon}" style="width:12px;"></i> ${st.lbl}</span>
                <button class="icon-btn" onclick="openModal('${sub.PIC}',${sub._row})"><i data-lucide="edit-3" style="width:12px;"></i></button>
                <button class="icon-btn danger" onclick="confirmDel(${sub._row})"><i data-lucide="trash-2" style="width:12px;"></i></button>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
              <div><b>Kriteria:</b> ${esc(sub.Kriteria) || "—"}</div>
              <div><b>Sebab:</b> ${esc(sub.Sebab) || "—"}</div>
              <div><b>Rekomendasi:</b> ${esc(sub.Rekomendasi) || "—"}</div>
              <div><b>Rencana Aksi:</b> ${esc(sub.RencanaAksi) || "—"}</div>
              <div><b>Jadwal & Output:</b> ${esc(sub.JadwalPelaksanaan) || "—"} / ${esc((sub.Output || '').replace(/\[(selesai|proses|belum)\]/gi, '')) || "—"}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');

  document.getElementById('flt-count').textContent = Object.keys(groups).length + ' Temuan Utama';
  refreshIcons();
}

function togRekap(main) { const d = main.nextElementSibling; if (d) d.style.display = d.style.display === 'none' ? 'block' : 'none'; }

function filterRekap() {
  const pf = document.getElementById('flt-pic').value;
  const q  = (document.getElementById('flt-q').value || '').toLowerCase();
  let v = 0;
  document.querySelectorAll('.rrow').forEach(r => {
    const mp = !pf || r.dataset.pic === pf, mq = !q || r.dataset.q.includes(q);
    r.style.display = mp && mq ? '' : 'none';
    if (mp && mq) v++;
  });
  document.getElementById('flt-count').textContent = v + ' Data Ditemukan';
}

// ══════════════════ EXPORT EXCEL ═════════════════════════════════
async function exportExcel() {
  if (!S.allR.length) { showToast('Tidak ada data untuk diekspor', 'inf'); return; }
  const btn = document.querySelector('.toolbar-wrap .btn-action-sec');
  const btnOriginalHtml = btn ? btn.innerHTML : null;
  if (btn) { btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px"></i> Menyiapkan...'; btn.disabled = true; refreshIcons(); }

  try {
    const NUM_COLS = 10;
    const thin = { style: 'thin', color: { argb: 'FF000000' } };
    const fullBorder = { top: thin, left: thin, bottom: thin, right: thin };
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('BPK Kinerja');

    ws.columns = [{ width:6 },{ width:35 },{ width:35 },{ width:25 },{ width:25 },{ width:30 },{ width:25 },{ width:30 },{ width:18 },{ width:25 }];

    const titles = [
      'TINDAKLANJUT HASIL PEMERIKSAAN BPK',
      'ATAS SINKRONISASI SISTEM INFORMASI PANGAN TAHUN 2024 S.D SEPTEMBER 2025',
      'DAN KESIAPAN PEMERINTAH MELAKSANAKAN PROGRAM KETAHANAN PANGAN POKOK TERTENTU/STRATEGIS PERIODE 2025-2029',
    ];
    titles.forEach((t, i) => {
      const rowNum = i + 1;
      ws.mergeCells(rowNum, 1, rowNum, NUM_COLS);
      const cell = ws.getCell(rowNum, 1);
      cell.value = t; cell.font = { bold: true, size: 16 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const header = ['No','Temuan','Sub Temuan','Kriteria','Sebab','Rekomendasi','PIC','Rencana Aksi','Jadwal Pelaksanaan','Output'];
    const headerRow = ws.getRow(5);
    header.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h; cell.font = { bold: true, size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      cell.border = fullBorder;
    });

    const DATA_START = 6;
    S.allR.forEach((r, i) => {
      const row = ws.getRow(DATA_START + i);
      [r.No||'', r.Temuan||'', r.SubTemuan||'', r.Kriteria||'', r.Sebab||'',
       r.Rekomendasi||'', r.PIC||'', r.RencanaAksi||'', r.JadwalPelaksanaan||'',
       (r.Output||'').replace(/\[(selesai|proses|belum)\]/gi,'').trim()
      ].forEach((val, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = val; cell.alignment = { vertical: 'top', wrapText: true }; cell.border = fullBorder;
      });
    });

    let grpStart = 0;
    for (let i = 1; i <= S.allR.length; i++) {
      const boundary = (i === S.allR.length) || String(S.allR[i].No || '') !== String(S.allR[grpStart].No || '');
      if (boundary) {
        const grpLen = i - grpStart;
        if (grpLen > 1) {
          const rStart = DATA_START + grpStart, rEnd = DATA_START + i - 1;
          ws.mergeCells(rStart, 1, rEnd, 1); ws.mergeCells(rStart, 2, rEnd, 2);
        }
        grpStart = i;
      }
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const now    = new Date();
    const fname  = `NKP_Kinerja_BPK_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.xlsx`;
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url; a.download = fname; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('File Excel berhasil diunduh!', 'ok');
  } catch (e) {
    showToast('Gagal membuat file Excel: ' + e.message, 'err');
  } finally {
    if (btn) { btn.innerHTML = btnOriginalHtml; btn.disabled = false; refreshIcons(); }
  }
}

// ══════════════════ MODAL CRUD ═══════════════════════════════════
function openModal(pic, row) {
  const sel = document.getElementById('m-pic');
  sel.innerHTML = '<option value="">— Pilih PIC —</option>' + S.picList.map(p => `<option value="${p.username}">${p.nama}</option>`).join('');
  document.getElementById('m-row').value       = row || '';
  document.getElementById('m-parent-row').value = '';
  document.getElementById('m-is-sub').value    = 'false';
  document.getElementById('modal-title').textContent = row ? 'Edit Tindak Lanjut' : 'Tambah Temuan Baru';
  document.getElementById('modal-sub').textContent   = row ? 'Perbarui rincian data tindak lanjut' : 'Lengkapi isian data berikut';
  document.getElementById('m-temuan').readOnly = false;
  document.getElementById('m-temuan').style.background = '#ffffff';
  ['m-no','m-temuan','m-subtemuan','m-kriteria','m-sebab','m-rekomendasi','m-rencanaaksi','m-jadwal','m-output'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('m-status-select').value = 'proses';
  document.getElementById('modal-bg').classList.add('open');

  if (row) {
    const r = S.allR.find(x => String(x._row) === String(row));
    if (r) {
      sel.value = r.PIC || '';
      document.getElementById('m-no').value          = r.No || '';
      document.getElementById('m-temuan').value      = r.Temuan || '';
      document.getElementById('m-subtemuan').value   = r.SubTemuan || '';
      document.getElementById('m-kriteria').value    = r.Kriteria || '';
      document.getElementById('m-sebab').value       = r.Sebab || '';
      document.getElementById('m-rekomendasi').value = r.Rekomendasi || '';
      document.getElementById('m-rencanaaksi').value = r.RencanaAksi || '';
      document.getElementById('m-jadwal').value      = r.JadwalPelaksanaan || '';
      document.getElementById('m-output').value      = (r.Output || '').replace(/\[(selesai|proses|belum)\]/gi, '').trim();
      const st = statusOf(r);
      document.getElementById('m-status-select').value = st.lbl === 'Selesai' ? 'selesai' : st.lbl === 'Proses' ? 'proses' : 'belum';
    }
  } else {
    sel.value = pic || '';
    document.getElementById('m-no').value = '...';
    apiFetch('/api/temuan/next-no').then(n => { document.getElementById('m-no').value = n; });
  }
}

function openAddSubModal(row) {
  const r = S.allR.find(x => String(x._row) === String(row));
  if (!r) return;
  const sel = document.getElementById('m-pic');
  sel.innerHTML = '<option value="">— Pilih PIC —</option>' + S.picList.map(p => `<option value="${p.username}">${p.nama}</option>`).join('');
  document.getElementById('m-row').value        = '';
  document.getElementById('m-parent-row').value = row;
  document.getElementById('m-is-sub').value     = 'true';
  document.getElementById('modal-title').textContent = 'Tambah Sub/Detail Tindak Lanjut';
  document.getElementById('modal-sub').textContent   = 'Menambahkan rincian tindak lanjut baru untuk Temuan No. ' + r.No;
  document.getElementById('m-no').value      = r.No || '';
  document.getElementById('m-temuan').value  = r.Temuan || '';
  document.getElementById('m-temuan').readOnly = true;
  document.getElementById('m-temuan').style.background = '#eef2ff';
  sel.value = r.PIC || '';
  document.getElementById('m-status-select').value = 'proses';
  ['m-subtemuan','m-kriteria','m-sebab','m-rekomendasi','m-rencanaaksi','m-jadwal','m-output'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('modal-bg').classList.add('open');
  refreshIcons();
}

function closeModal()    { document.getElementById('modal-bg').classList.remove('open'); }
function closeModalBg(e) { if (e.target === document.getElementById('modal-bg')) closeModal(); }

function saveTemuan() {
  const isSub           = document.getElementById('m-is-sub').value === 'true';
  const selectedStatus  = document.getElementById('m-status-select').value;
  let rawOutput         = document.getElementById('m-output').value.trim();

  if      (selectedStatus === 'selesai') rawOutput = rawOutput ? rawOutput + ' [Selesai]' : 'Selesai [Selesai]';
  else if (selectedStatus === 'proses')  rawOutput = rawOutput ? rawOutput + ' [Proses]'  : '[Proses]';
  else                                   rawOutput = rawOutput ? rawOutput + ' [Belum]'   : '[Belum]';

  const fd = {
    No:                 document.getElementById('m-no').value,
    PIC:                document.getElementById('m-pic').value,
    Temuan:             document.getElementById('m-temuan').value.trim(),
    SubTemuan:          document.getElementById('m-subtemuan').value.trim(),
    Kriteria:           document.getElementById('m-kriteria').value.trim(),
    Sebab:              document.getElementById('m-sebab').value.trim(),
    Rekomendasi:        document.getElementById('m-rekomendasi').value.trim(),
    RencanaAksi:        document.getElementById('m-rencanaaksi').value.trim(),
    JadwalPelaksanaan:  document.getElementById('m-jadwal').value.trim(),
    Output:             rawOutput,
    isSubAdd:           isSub,
    parentRow:          document.getElementById('m-parent-row').value,
  };

  if (!fd.Temuan) { showToast('Uraian Temuan wajib diisi', 'err'); return; }
  if (!fd.PIC)    { showToast('PIC wajib dipilih',         'err'); return; }

  const row = document.getElementById('m-row').value;
  const btn = document.querySelector('.modal-footer-area .btn-action-pri');
  if (btn) { btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;"></i> Menyimpan...'; btn.disabled = true; refreshIcons(); }

  const url    = row ? '/api/temuan/' + row : '/api/temuan';
  const method = row ? 'PUT' : 'POST';

  apiFetch(url, method, fd)
    .then(res => {
      if (btn) { btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Simpan Data'; btn.disabled = false; }
      if (res && res.success) { closeModal(); showToast('Data berhasil disimpan', 'ok'); refreshCurrentPage(); }
      else showToast((res && res.message) ? res.message : 'Gagal menyimpan', 'err');
    })
    .catch(e => {
      if (btn) { btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Simpan Data'; btn.disabled = false; }
      showToast('Error: ' + e.message, 'err');
    });
}

function refreshCurrentPage() {
  if      (S.page === 'ruang-isian') loadRuangIsian(S.riFilter || '');
  else if (S.page === 'rekap')       loadRekap();
  else                               loadDashboard();
}

// ══════════════════ DELETE ═══════════════════════════════════════
let _delRow = null;
function confirmDel(row) { _delRow = row; document.getElementById('conf-bg').classList.add('open'); }
function closeConf()     { document.getElementById('conf-bg').classList.remove('open'); _delRow = null; }

document.getElementById('btn-conf-ok').addEventListener('click', function () {
  if (!_delRow) return;
  const row = _delRow;
  closeConf();
  apiFetch('/api/temuan/' + row, 'DELETE')
    .then(res => {
      if (res && res.success) { showToast('Data berhasil dihapus', 'ok'); refreshCurrentPage(); }
      else showToast((res && res.message) ? res.message : 'Gagal menghapus', 'err');
    })
    .catch(e => showToast('Error: ' + e.message, 'err'));
});

// ══════════════════ UTILS ════════════════════════════════════════
function setBody(h)   { document.getElementById('page-body').innerHTML = h; }
function loadingHtml(){ return '<div style="text-align:center;padding:80px;color:var(--text-muted)"><i data-lucide="loader-2" class="spin" style="width:32px;height:32px;margin-bottom:8px;"></i><div>Memuat Data...</div></div>'; }
function esc(s)       { return (s == null ? '' : String(s)).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

function showToast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  const icons = { ok: 'check-circle-2', err: 'alert-circle', inf: 'info' };
  t.innerHTML   = `<i data-lucide="${icons[type] || 'info'}" style="width:18px;"></i> <span>${msg}</span>`;
  t.className   = 'toast-msg show';
  refreshIcons();
  setTimeout(() => { t.className = 'toast-msg'; }, 3200);
}
