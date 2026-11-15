/* ============================================
   MAP LOGIC - Leaflet integration
   Renders markers, handles filters, finds nearest
   ============================================ */

let map = null;
let markersLayer = null;
let userLocationMarker = null;
let activeCategories = []; // Empty = all
let currentPopupBinId = null;

function initMap() {
  map = L.map('map', { zoomControl: true }).setView(UNTAD_CENTER, 17);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles © Esri | Data © OpenStreetMap contributors'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  renderMarkers();
  updateStats();

  // Auto-request user location on load; zoom to show 3+ nearest bins
  if (navigator.geolocation) {
    showToast('📍 Mencari lokasi Anda...', 'info');
    navigator.geolocation.getCurrentPosition(
      pos => focusOnUserLocation(pos.coords.latitude, pos.coords.longitude, { announce: true }),
      () => showToast('ℹ️ Lokasi ditolak, menampilkan area kampus', 'info'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }
}

// Reusable: show user marker on map
function showUserMarker(lat, lng) {
  if (userLocationMarker) map.removeLayer(userLocationMarker);
  userLocationMarker = L.marker([lat, lng], {
    icon: L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
    title: 'Lokasi Anda', alt: 'Lokasi Anda', keyboard: true
  }).addTo(map).bindPopup('<b>Lokasi Anda</b>');
}

// Map a max distance (meters) to a zoom level that comfortably shows it
function distanceToZoom(meters) {
  if (meters < 150) return 18;
  if (meters < 400) return 17;
  if (meters < 900) return 16;
  if (meters < 2000) return 15;
  if (meters < 5000) return 14;
  if (meters < 15000) return 13;
  return 12;
}

// Center map on user location with a zoom that fits the 3 nearest bins
function focusOnUserLocation(uLat, uLng, { announce = false } = {}) {
  const nearest = findNearestBins(uLat, uLng, [], 3);
  const targetDist = nearest.length >= 3
    ? nearest[2].distance
    : (nearest.length > 0 ? nearest[nearest.length - 1].distance : 1000);
  const zoom = distanceToZoom(targetDist);
  map.setView([uLat, uLng], zoom);
  showUserMarker(uLat, uLng);
  if (announce) {
    const distFromCampus = distanceMeters(uLat, uLng, UNTAD_CENTER[0], UNTAD_CENTER[1]);
    if (distFromCampus > 2000) {
      const distKm = (distFromCampus / 1000).toFixed(1);
      showToast(`📍 Anda ${distKm} km dari area kampus. Menampilkan bin terdekat.`, 'info', 6000);
    } else {
      showToast(`📍 ${nearest.length} tempat sampah terdekat terlihat di sekitar Anda`, 'success', 5000);
    }
  }
}

function renderMarkers() {
  markersLayer.clearLayers();
  const bins = getApprovedBins().filter(b => {
    if (activeCategories.length === 0) return true;
    return b.categories.some(c => activeCategories.includes(c));
  });
  bins.forEach(bin => {
    const isHijau = bin.status === 'terurus';
    const icon = L.divIcon({
      className: '',
      html: `<div class="bin-marker ${isHijau ? 'hijau' : 'merah'}"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    const marker = L.marker([bin.lat, bin.lng], { icon, title: bin.name, alt: bin.name, keyboard: true });
    marker.bindPopup(buildBinPopup(bin), { maxWidth: 280 });
    marker.on('popupopen', () => { currentPopupBinId = bin.id; });
    marker.on('popupclose', () => { currentPopupBinId = null; });
    marker.addTo(markersLayer);
  });
}

function buildBinPopup(bin) {
  const statusInfo = STATUS[bin.status];
  const catBadges = bin.categories.map(c => {
    const info = CATEGORIES[c];
    return `<span class="cat-badge cat-${c}">${info.label}</span>`;
  }).join('');
  const photoHtml = bin.photo
    ? `<img src="${bin.photo}" alt="Foto ${bin.name}">`
    : '';
  return `
    <div class="bin-popup">
      <div class="popup-header">
        <span>${escapeHtml(bin.name)}</span>
        <span class="status-badge status-${statusInfo.color}">${statusInfo.label}</span>
      </div>
      <div class="popup-body">
        ${photoHtml}
        <div class="cat-badges">${catBadges}</div>
        ${bin.floor ? `<div class="info-row"><span class="key">Lokasi</span><span class="val">${escapeHtml(bin.floor)}</span></div>` : ''}
        ${bin.description ? `<div class="info-row"><span class="key">Keterangan</span><span class="val">${escapeHtml(bin.description)}</span></div>` : ''}
        <div class="info-row"><span class="key">Koordinat</span><span class="val text-small">${bin.lat.toFixed(5)}, ${bin.lng.toFixed(5)}</span></div>
      </div>
      <div class="actions">
        <button onclick="openReportModal('${bin.id}')">⚠️ Lapor Kondisi</button>
        <button class="primary" onclick="focusOnBin('${bin.id}')">📍 Lihat di Peta</button>
      </div>
    </div>
  `;
}

function focusOnBin(binId) {
  const bin = getApprovedBins().find(b => b.id === binId);
  if (bin) {
    map.setView([bin.lat, bin.lng], 19);
    markersLayer.eachLayer(m => {
      if (m.getLatLng && Math.abs(m.getLatLng().lat - bin.lat) < 0.00001) {
        m.openPopup();
      }
    });
  }
}

function setActiveCategories(cats) {
  activeCategories = cats;
  renderMarkers();
}

function findNearest() {
  if (!navigator.geolocation) {
    showToast('Browser Anda tidak mendukung GPS', 'error');
    return;
  }
  showToast('Mencari lokasi Anda...', 'info');
  navigator.geolocation.getCurrentPosition(pos => {
    const uLat = pos.coords.latitude;
    const uLng = pos.coords.longitude;
    showUserMarker(uLat, uLng);
    const nearest = findNearestBins(uLat, uLng, activeCategories, 1);
    if (nearest.length === 0) {
      showToast('Tidak ada tempat sampah yang sesuai filter', 'info');
      return;
    }
    const { bin, distance } = nearest[0];
    const distStr = distance < 1000 ? Math.round(distance) + ' m' : (distance/1000).toFixed(2) + ' km';
    showToast(`Terdekat: ${bin.name} (${distStr})`, 'success');
    map.setView([bin.lat, bin.lng], 19);
    setTimeout(() => {
      markersLayer.eachLayer(m => {
        if (m.getLatLng && Math.abs(m.getLatLng().lat - bin.lat) < 0.00001) m.openPopup();
      });
    }, 400);
  }, err => {
    showToast('Gagal mendapatkan lokasi: ' + err.message, 'error');
  }, { enableHighAccuracy: true, timeout: 10000 });
}

function updateStats() {
  const stats = getStats();
  document.getElementById('statTotal').textContent = stats.totalBins;
  document.getElementById('statHijau').textContent = stats.binsHijau;
  document.getElementById('statMerah').textContent = stats.binsMerah;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Toast notification
function showToast(message, type = 'info', duration = 4000) {
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
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
