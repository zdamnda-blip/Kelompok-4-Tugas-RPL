/* ============================================
   FORMS - Tambah Lokasi & Lapor Kondisi
   ============================================ */

let coordPickerMap = null;
let coordPickerMarker = null;
let currentPhotoBase64 = null;
let currentReportBinId = null;

// ===== TAMBAH LOKASI =====
function openAddModal() {
  document.getElementById('addModal').classList.add('active');
  resetAddForm();
  // Init coord picker map
  setTimeout(() => {
    if (!coordPickerMap) {
      coordPickerMap = L.map('coordMap').setView(UNTAD_CENTER, 17);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles © Esri | Data © OpenStreetMap'
      }).addTo(coordPickerMap);
      coordPickerMarker = L.marker(UNTAD_CENTER, { draggable: true }).addTo(coordPickerMap);
      coordPickerMarker.on('dragend', e => {
        const { lat, lng } = e.target.getLatLng();
        updateCoordInputs(lat, lng);
      });
      coordPickerMap.on('click', e => {
        coordPickerMarker.setLatLng(e.latlng);
        updateCoordInputs(e.latlng.lat, e.latlng.lng);
      });
    } else {
      coordPickerMap.invalidateSize();
    }
  }, 100);
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('active');
}

function resetAddForm() {
  document.getElementById('addName').value = '';
  document.getElementById('addFloor').value = '';
  document.getElementById('addDescription').value = '';
  document.getElementById('addStatus').value = 'terurus';
  currentPhotoBase64 = null;
  document.getElementById('addPhotoPreview').src = '';
  document.getElementById('addPhotoPlaceholder').classList.remove('hidden');
  document.getElementById('addPhotoPreview').classList.add('hidden');
  document.getElementById('addPhotoUpload').classList.remove('has-photo');
  document.querySelectorAll('#addForm .cat-checkbox').forEach(el => el.classList.remove('checked'));
  document.querySelectorAll('#addForm .cat-checkbox input').forEach(el => el.checked = false);
  if (coordPickerMarker) {
    coordPickerMarker.setLatLng(UNTAD_CENTER);
    updateCoordInputs(UNTAD_CENTER[0], UNTAD_CENTER[1]);
  }
}

function updateCoordInputs(lat, lng) {
  document.getElementById('addLat').value = lat.toFixed(6);
  document.getElementById('addLng').value = lng.toFixed(6);
}

function useMyLocation() {
  if (!navigator.geolocation) { showToast('GPS tidak tersedia', 'error'); return; }
  showToast('Mengambil lokasi...', 'info');
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    if (coordPickerMarker) coordPickerMarker.setLatLng([lat, lng]);
    if (coordPickerMap) coordPickerMap.setView([lat, lng], 18);
    updateCoordInputs(lat, lng);
    showToast('Lokasi ditemukan', 'success');
  }, err => {
    showToast('Gagal: ' + err.message, 'error');
  });
}

function handleAddPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Foto terlalu besar (max 5MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    // Compress image
    compressImage(e.target.result, 800, 0.7).then(compressed => {
      currentPhotoBase64 = compressed;
      document.getElementById('addPhotoPreview').src = compressed;
      document.getElementById('addPhotoPreview').classList.remove('hidden');
      document.getElementById('addPhotoPlaceholder').classList.add('hidden');
      document.getElementById('addPhotoUpload').classList.add('has-photo');
    });
  };
  reader.readAsDataURL(file);
}

function submitAddBin() {
  const name = document.getElementById('addName').value.trim();
  const lat = parseFloat(document.getElementById('addLat').value);
  const lng = parseFloat(document.getElementById('addLng').value);
  const floor = document.getElementById('addFloor').value.trim();
  const description = document.getElementById('addDescription').value.trim();
  const status = document.getElementById('addStatus').value;
  const categories = Array.from(document.querySelectorAll('#addForm .cat-checkbox input:checked'))
    .map(el => el.value);

  if (!name) { showToast('Nama lokasi wajib diisi', 'error'); return; }
  if (isNaN(lat) || isNaN(lng)) { showToast('Koordinat tidak valid', 'error'); return; }
  if (categories.length === 0) { showToast('Pilih minimal 1 jenis sampah', 'error'); return; }

  const bin = addBin({
    name, lat, lng, floor, description, status, categories,
    photo: currentPhotoBase64
  });

  closeAddModal();
  showToast('✅ Terima kasih! Lokasi Anda akan diverifikasi admin sebelum muncul di peta.', 'success', 6000);
  console.log('New bin submitted:', bin);
}

// ===== LAPOR KONDISI =====
function openReportModal(binId) {
  currentReportBinId = binId;
  const bin = getApprovedBins().find(b => b.id === binId);
  if (!bin) return;
  document.getElementById('reportBinName').textContent = bin.name;
  document.getElementById('reportModal').classList.add('active');
  document.getElementById('reportType').value = '';
  document.getElementById('reportNotes').value = '';
  document.getElementById('reportPhoto').value = '';
  document.getElementById('reportPhotoPreview').src = '';
  document.getElementById('reportPhotoPreview').classList.add('hidden');
  document.getElementById('reportPhotoPlaceholder').classList.remove('hidden');
  document.getElementById('reportPhotoUpload').classList.remove('has-photo');
  currentReportPhotoBase64 = null;
  map.closePopup();
}

let currentReportPhotoBase64 = null;

function closeReportModal() {
  document.getElementById('reportModal').classList.remove('active');
  currentReportBinId = null;
}

function handleReportPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Foto terlalu besar (max 5MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    compressImage(e.target.result, 800, 0.7).then(compressed => {
      currentReportPhotoBase64 = compressed;
      document.getElementById('reportPhotoPreview').src = compressed;
      document.getElementById('reportPhotoPreview').classList.remove('hidden');
      document.getElementById('reportPhotoPlaceholder').classList.add('hidden');
      document.getElementById('reportPhotoUpload').classList.add('has-photo');
    });
  };
  reader.readAsDataURL(file);
}

function submitReport() {
  const type = document.getElementById('reportType').value;
  const notes = document.getElementById('reportNotes').value.trim();
  if (!type) { showToast('Pilih jenis laporan', 'error'); return; }

  addReport(currentReportBinId, {
    type, notes, photo: currentReportPhotoBase64
  });

  closeReportModal();
  showToast('✅ Terima kasih! Laporan Anda akan diverifikasi admin.', 'success', 6000);
}

// ===== IMAGE COMPRESSION =====
function compressImage(dataUrl, maxWidth, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxWidth) {
        h = h * (maxWidth / w);
        w = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
