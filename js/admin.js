/* ============================================
   ADMIN PAGE - Login + Dashboard + Moderation
   ============================================ */

let isLoggedIn = false;

function checkLogin() {
  const saved = sessionStorage.getItem('petaSampah_admin');
  if (saved === 'authenticated') {
    isLoggedIn = true;
    showDashboard();
  }
}

function handleLogin() {
  const pwd = document.getElementById('adminPassword').value;
  if (pwd === ADMIN_PASSWORD) {
    isLoggedIn = true;
    sessionStorage.setItem('petaSampah_admin', 'authenticated');
    showDashboard();
  } else {
    document.getElementById('loginError').textContent = 'Password salah. Coba lagi.';
    document.getElementById('loginError').classList.remove('hidden');
  }
}

function logout() {
  isLoggedIn = false;
  sessionStorage.removeItem('petaSampah_admin');
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('dashboardView').classList.add('hidden');
  document.getElementById('adminPassword').value = '';
}

function showDashboard() {
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('dashboardView').classList.remove('hidden');
  renderDashboard();
}

function renderDashboard() {
  const stats = getStats();
  const pending = getPendingItems();

  // Stats
  document.getElementById('statTotalBins').textContent = stats.totalBins;
  document.getElementById('statBinsHijau').textContent = stats.binsHijau;
  document.getElementById('statBinsMerah').textContent = stats.binsMerah;
  document.getElementById('statTotalReports').textContent = stats.totalReports;
  document.getElementById('pendingCount').textContent =
    stats.pendingNewBins + stats.pendingReports;

  // Pending list
  const list = document.getElementById('pendingList');
  if (pending.length === 0) {
    list.innerHTML = '<div class="empty-state">✅ Tidak ada submission yang perlu diverifikasi.</div>';
    return;
  }

  list.innerHTML = pending.map(item => {
    if (item.kind === 'new_bin') {
      const bin = item.bin;
      const cats = bin.categories.map(c =>
        `<span class="cat-badge cat-${c}">${CATEGORIES[c].label}</span>`
      ).join('');
      return `
        <div class="pending-item" data-id="${bin.id}" data-kind="new_bin">
          ${bin.photo ? `<img src="${bin.photo}" alt="">` : '<div style="width:80px;height:80px;background:#eee;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📍</div>'}
          <div class="meta">
            <span class="type-badge">TAMBAH LOKASI BARU</span>
            <h4>${escapeHtml(bin.name)}</h4>
            <p>${cats}</p>
            ${bin.floor ? `<p>📍 ${escapeHtml(bin.floor)}</p>` : ''}
            ${bin.description ? `<p>${escapeHtml(bin.description)}</p>` : ''}
            <p class="text-small text-muted">Koordinat: ${bin.lat.toFixed(5)}, ${bin.lng.toFixed(5)}</p>
            <p class="text-small text-muted">Status: ${STATUS[bin.status].label}</p>
          </div>
          <div class="actions">
            <button class="btn-approve" onclick="handleApprove('${bin.id}', 'new_bin')">✓ Setujui</button>
            <button class="btn-reject" onclick="handleReject('${bin.id}', 'new_bin')">✕ Tolak</button>
          </div>
        </div>
      `;
    } else if (item.kind === 'report') {
      const r = item.report;
      const bin = getData().bins.find(b => b.id === r.binId);
      const binName = bin ? bin.name : '(bin telah dihapus)';
      return `
        <div class="pending-item" data-id="${r.id}" data-kind="report">
          ${r.photo ? `<img src="${r.photo}" alt="">` : '<div style="width:80px;height:80px;background:#eee;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">⚠️</div>'}
          <div class="meta">
            <span class="type-badge">LAPORAN KONDISI</span>
            <h4>${escapeHtml(binName)}</h4>
            <p><strong>Kondisi:</strong> ${REPORT_TYPES[r.type]}</p>
            ${r.notes ? `<p>${escapeHtml(r.notes)}</p>` : ''}
            <p class="text-small text-muted">Dilaporkan: ${formatDate(r.createdAt)}</p>
          </div>
          <div class="actions">
            <button class="btn-approve" onclick="handleApprove('${r.id}', 'report')">✓ Setujui</button>
            <button class="btn-reject" onclick="handleReject('${r.id}', 'report')">✕ Tolak</button>
          </div>
        </div>
      `;
    }
    return '';
  }).join('');
}

function handleApprove(id, kind) {
  const data = getData();
  let itemRef;
  if (kind === 'new_bin') {
    itemRef = { kind: 'new_bin', bin: data.bins.find(b => b.id === id) };
  } else {
    itemRef = { kind: 'report', report: data.reports.find(r => r.id === id) };
  }
  if (approvePending(itemRef)) {
    showToast('✓ Disetujui', 'success');
    renderDashboard();
  }
}

function handleReject(id, kind) {
  const data = getData();
  let itemRef;
  if (kind === 'new_bin') {
    itemRef = { kind: 'new_bin', bin: data.bins.find(b => b.id === id) };
  } else {
    itemRef = { kind: 'report', report: data.reports.find(r => r.id === id) };
  }
  if (rejectPending(itemRef)) {
    showToast('✕ Ditolak', 'info');
    renderDashboard();
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
