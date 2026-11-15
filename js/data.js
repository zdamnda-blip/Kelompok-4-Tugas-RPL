/* ============================================
   DATA LAYER - localStorage management
   Handles all data: bins, reports, submissions
   ============================================ */

const STORAGE_KEY = 'petaSampah_data_v1';
const ADMIN_PASSWORD = 'admin123'; // Hardcoded admin password

// UNTAD (Universitas Tadulako) center - Palu, Sulawesi Tengah
const UNTAD_CENTER = [-0.8364, 119.8932];

// Category definitions
const CATEGORIES = {
  organik:   { label: 'Organik',   color: '#2d8659' },
  anorganik:  { label: 'Anorganik', color: '#3a7ca5' },
  b3:        { label: 'B3',        color: '#c1442e' },
  campur:    { label: 'Campur',    color: '#888' }
};

// Status definitions for bin condition
const STATUS = {
  terurus:        { label: 'Masih terurus',         color: 'hijau' },
  tidak_terurus:  { label: 'Tidak terurus',         color: 'merah' }
};

// Condition report types
const REPORT_TYPES = {
  penuh:         'Sudah penuh',
  rusak:         'Rusak / bocor',
  tidak_ada:     'Sudah tidak ada / dipindah',
  tidak_terurus: 'Tidak terurus lagi'
};

/**
 * Get all data from localStorage.
 * If empty, initialize with sample data.
 */
function getData() {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); }
    catch (e) { console.warn('Corrupt data, resetting'); }
  }
  // First time: init with sample data
  const init = { bins: SAMPLE_BINS, reports: [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
  return init;
}

/**
 * Save all data to localStorage.
 */
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    if (typeof showToast === 'function') {
      showToast('❌ Penyimpanan penuh. Hapus data lama (localStorage.clear) lalu refresh.', 'error', 8000);
    }
    return false;
  }
}

/**
 * Get all APPROVED bins (visible on public map).
 */
function getApprovedBins() {
  return getData().bins.filter(b => b.submissionStatus === 'approved');
}

/**
 * Get all pending submissions (for admin review).
 * Combines pending new bins + pending reports.
 */
function getPendingItems() {
  const data = getData();
  const pendingBins = data.bins
    .filter(b => b.submissionStatus === 'pending')
    .map(b => ({ kind: 'new_bin', bin: b, createdAt: b.createdAt }));
  const pendingReports = data.reports
    .filter(r => r.status === 'pending')
    .map(r => ({ kind: 'report', report: r, createdAt: r.createdAt }));
  return [...pendingBins, ...pendingReports]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Add a new bin (new submission).
 * Will appear on map only after admin approves.
 */
function addBin(binData) {
  const data = getData();
  const newBin = {
    id: 'bin_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    ...binData,
    submissionStatus: 'pending',
    createdAt: new Date().toISOString()
  };
  data.bins.push(newBin);
  saveData(data);
  return newBin;
}

/**
 * Add a new report (lapor kondisi) for an existing bin.
 */
function addReport(binId, reportData) {
  const data = getData();
  const report = {
    id: 'rep_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    binId: binId,
    type: reportData.type,
    notes: reportData.notes || '',
    photo: reportData.photo || null,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  data.reports.push(report);
  saveData(data);
  return report;
}

/**
 * Approve a pending item.
 * For new_bin: change submissionStatus to 'approved'
 * For report: change status to 'approved' AND update the bin's status if applicable
 */
function approvePending(itemRef) {
  const data = getData();
  if (itemRef.kind === 'new_bin') {
    const bin = data.bins.find(b => b.id === itemRef.bin.id);
    if (bin) {
      bin.submissionStatus = 'approved';
      saveData(data);
      return true;
    }
  } else if (itemRef.kind === 'report') {
    const report = data.reports.find(r => r.id === itemRef.report.id);
    if (report) {
      report.status = 'approved';
      // If report says "tidak_ada" or "tidak_terurus", update bin status
      if (report.type === 'tidak_terurus') {
        const bin = data.bins.find(b => b.id === report.binId);
        if (bin) bin.status = 'tidak_terurus';
      } else if (report.type === 'tidak_ada') {
        // Mark bin as removed - hide from map
        const bin = data.bins.find(b => b.id === report.binId);
        if (bin) bin.submissionStatus = 'rejected';
      } else if (report.type === 'rusak') {
        const bin = data.bins.find(b => b.id === report.binId);
        if (bin) bin.status = 'tidak_terurus';
      }
      saveData(data);
      return true;
    }
  }
  return false;
}

/**
 * Reject a pending item.
 */
function rejectPending(itemRef) {
  const data = getData();
  if (itemRef.kind === 'new_bin') {
    // Remove the bin entirely
    data.bins = data.bins.filter(b => b.id !== itemRef.bin.id);
    saveData(data);
    return true;
  } else if (itemRef.kind === 'report') {
    const report = data.reports.find(r => r.id === itemRef.report.id);
    if (report) {
      report.status = 'rejected';
      saveData(data);
      return true;
    }
  }
  return false;
}

/**
 * Compute dashboard statistics.
 */
function getStats() {
  const data = getData();
  const bins = data.bins.filter(b => b.submissionStatus === 'approved');
  const reports = data.reports;

  return {
    totalBins: bins.length,
    binsHijau: bins.filter(b => b.status === 'terurus').length,
    binsMerah: bins.filter(b => b.status === 'tidak_terurus').length,
    byCategory: {
      organik:  bins.filter(b => b.categories.includes('organik')).length,
      anorganik: bins.filter(b => b.categories.includes('anorganik')).length,
      b3:       bins.filter(b => b.categories.includes('b3')).length,
      campur:   bins.filter(b => b.categories.includes('campur')).length
    },
    pendingNewBins: data.bins.filter(b => b.submissionStatus === 'pending').length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    totalReports: reports.length
  };
}

/**
 * Haversine distance in meters between two coords.
 */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Find nearest bins to a given position, with optional category filter.
 * Returns sorted array of {bin, distance}.
 */
function findNearestBins(userLat, userLng, categoriesFilter, limit = 5) {
  const bins = getApprovedBins().filter(b => {
    if (!categoriesFilter || categoriesFilter.length === 0) return true;
    return b.categories.some(c => categoriesFilter.includes(c));
  });
  const withDist = bins.map(b => ({
    bin: b,
    distance: distanceMeters(userLat, userLng, b.lat, b.lng)
  }));
  withDist.sort((a, b) => a.distance - b.distance);
  return withDist.slice(0, limit);
}

/* ============================================
   SAMPLE DATA - 8 dummy bins around UNTAD area
   These are FICTITIOUS coordinates, reasonable
   for demo purposes.
   ============================================ */
const SAMPLE_BINS = [
  {
    id: 'bin_sample_001',
    name: 'TPS Fakultas Teknik',
    lat: -0.8355, lng: 119.8925,
    categories: ['organik', 'anorganik'],
    floor: 'Lantai 1',
    description: 'Samping pintu masuk utama Fakultas Teknik, dekat pos satpam.',
    status: 'terurus',
    photo: null,
    submissionStatus: 'approved',
    createdAt: '2026-09-15T08:00:00.000Z'
  },
  {
    id: 'bin_sample_002',
    name: 'TPS Kantin Pusat',
    lat: -0.8368, lng: 119.8938,
    categories: ['organik', 'anorganik', 'campur'],
    floor: 'Outdoor',
    description: 'Area kantin pusat, melayani sampah dari aktivitas makan mahasiswa.',
    status: 'terurus',
    photo: null,
    submissionStatus: 'approved',
    createdAt: '2026-09-15T08:05:00.000Z'
  },
  {
    id: 'bin_sample_003',
    name: 'TPS Perpustakaan',
    lat: -0.8372, lng: 119.8922,
    categories: ['anorganik', 'campur'],
    floor: 'Lantai 1',
    description: 'Depan pintu masuk Perpustakaan Universitas Tadulako.',
    status: 'terurus',
    photo: null,
    submissionStatus: 'approved',
    createdAt: '2026-09-15T08:10:00.000Z'
  },
  {
    id: 'bin_sample_004',
    name: 'TPS Fakultas Ekonomi',
    lat: -0.8350, lng: 119.8940,
    categories: ['organik', 'anorganik'],
    floor: 'Lantai 1',
    description: 'Area lobby Fakultas Ekonomi, dilengkapi tempat sampah terpilah.',
    status: 'terurus',
    photo: null,
    submissionStatus: 'approved',
    createdAt: '2026-09-15T08:15:00.000Z'
  },
  {
    id: 'bin_sample_005',
    name: 'TPS Student Center',
    lat: -0.8362, lng: 119.8918,
    categories: ['organik', 'anorganik', 'b3', 'campur'],
    floor: 'Outdoor',
    description: 'Pusat kegiatan mahasiswa, menerima semua jenis sampah termasuk B3 (baterai, lampu).',
    status: 'terurus',
    photo: null,
    submissionStatus: 'approved',
    createdAt: '2026-09-15T08:20:00.000Z'
  },
  {
    id: 'bin_sample_006',
    name: 'TPS Gedung Rektorat',
    lat: -0.8345, lng: 119.8930,
    categories: ['anorganik', 'campur'],
    floor: 'Lantai 1',
    description: 'Area depan Gedung Rektorat UNTAD.',
    status: 'tidak_terurus',
    photo: null,
    submissionStatus: 'approved',
    createdAt: '2026-09-15T08:25:00.000Z'
  },
  {
    id: 'bin_sample_007',
    name: 'TPS Masjid',
    lat: -0.8375, lng: 119.8945,
    categories: ['organik', 'anorganik', 'campur'],
    floor: 'Outdoor',
    description: 'Area wudhu dan halaman Masjid Universitas Tadulako.',
    status: 'terurus',
    photo: null,
    submissionStatus: 'approved',
    createdAt: '2026-09-15T08:30:00.000Z'
  },
  {
    id: 'bin_sample_008',
    name: 'TPS Fakultas Keguruan',
    lat: -0.8380, lng: 119.8915,
    categories: ['anorganik', 'campur'],
    floor: 'Lantai 2',
    description: 'Lantai 2 Fakultas Keguruan, dekat ruang dosen.',
    status: 'tidak_terurus',
    photo: null,
    submissionStatus: 'approved',
    createdAt: '2026-09-15T08:35:00.000Z'
  }
];
