# Peta Sampah UNTAD

Aplikasi web interaktif untuk memetakan, mencari, dan mengelola informasi tempat sampah di area Universitas Tadulako (UNTAD), Palu.

**Dibuat oleh:** Kelompok 6 - Mata Kuliah Kajian Lingkungan Hidup
**Konsep:** Mengubah "tidak tahu" jadi "tahu" - informasi tempat sampah yang transparan & ter-update.

---

## 🚀 Cara Menjalankan

Cukup buka file `index.html` di browser modern (Chrome, Firefox, Edge, Safari).

```bash
# Cara 1: Double-click file index.html
# Cara 2: Via terminal (Linux/Mac)
open /home/faiqmuh/Peta\ Sampah/index.html

# Cara 3: Local server (opsional, untuk akses dari HP)
cd "/home/faiqmuh/Peta Sampah"
python3 -m http.server 8000
# Lalu buka http://localhost:8000 di browser
```

> ⚠️ **Penting:** Jangan rename atau pindahkan folder. Semua path file saling terkait relatif.

---

## 🔐 Login Admin

1. Buka `admin.html` atau klik tombol **🔐 Admin** di pojok kanan atas
2. Masukkan password: **`admin123`**
3. Dashboard admin akan muncul dengan statistik & antrian submission

---

## ✨ Fitur

### Publik (index.html)
- 🗺️ Peta interaktif berbasis OpenStreetMap
- 🟢🔴 Color status (hijau = terurus, merah = tidak terurus)
- 🗂️ Filter kategori sampah (Organik / Anorganik / B3 / Campur)
- 📍 Cari tempat sampah terdekat (pakai GPS)
- ➕ Tambah lokasi baru (form dengan koordinat drag/drop, foto, kategori)
- ⚠️ Lapor kondisi (penuh/rusak/tidak ada/tidak terurus)
- 📊 Statistik real-time di sidebar

### Admin (admin.html)
- 📊 Dashboard dengan 4 KPI utama
- 📋 Antrian submission tertunda
- ✓✕ Approve / Reject untuk tambah lokasi baru & lapor kondisi
- 🔄 Auto-update status bin saat laporan kondisi disetujui

---

## 📁 Struktur File

```
Peta Sampah/
├── index.html          # Halaman utama (peta publik)
├── admin.html          # Halaman dashboard admin
├── README.md           # File ini
├── css/
│   └── style.css       # Stylesheet utama
├── js/
│   ├── data.js         # Data layer + sample data + localStorage CRUD
│   ├── map.js          # Leaflet map logic
│   ├── forms.js        # Form tambah & lapor
│   └── admin.js        # Login & dashboard logic
└── assets/
    └── logo-untad.png  # Logo UNTAD
```

---

## 💾 Data

- **Storage:** localStorage browser (tidak perlu server)
- **Sample awal:** 8 titik tempat sampah dummy di area UNTAD
- **Auto-compress:** Foto di-compress ke max 800px / JPEG 70% agar muat di localStorage (limit ~5-10MB)
- **Reset data:** Buka console browser, ketik `localStorage.clear()` lalu refresh

---

## 🛠️ Tech Stack

- **Leaflet.js** (render peta)
- **Esri World Street Map** (tile server, gratis, tanpa API key)
- **Vanilla JavaScript** (no framework)
- **HTML5 Geolocation API** (GPS)
- **localStorage** (database)
- **Canvas API** (image compression)
- **Font Awesome-style emoji** (icons)

---

## 📝 Catatan

- Data submission baru akan masuk antrian admin, **tidak langsung tampil** di peta publik
- Lokasi marker bisa dipilih dengan 3 cara: klik peta, drag marker, atau gunakan GPS
- Foto otomatis di-compress sebelum disimpan
- Untuk demo presentasi: pakai sample data (8 bin) yang sudah tersedia

---

## 🎯 Untuk Presentasi Kelompok 6

1. Buka `index.html` - tunjukkan peta dengan 8 sample bin
2. Demo filter kategori - klik checkbox "Organik", tunjukkan peta menyaring
3. Demo cari terdekat - klik tombol cari, izinkan GPS
4. Buka popup salah satu bin - tunjukkan detail info
5. Tambah lokasi baru - isi form, submit (akan masuk antrian admin)
6. Buka `admin.html` - login dengan `admin123`
7. Tunjukkan dashboard dengan submission yang baru masuk
8. Approve submission - kembali ke peta, refresh, tunjukkan bin baru muncul

---

© 2026 - Kelompok 6, Teknik Informatika UNTAD
