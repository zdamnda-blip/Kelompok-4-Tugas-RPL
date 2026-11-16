# Peta Sampah UNTAD

Aplikasi web untuk memetakan dan mencari tempat sampah di area Universitas Tadulako, Palu, yang dilengkapi pipeline Continuous Integration (CI) dengan GitHub Actions.

- Mata kuliah: Rekayasa Perangkat Lunak
- Program studi: Teknik Informatika, Universitas Tadulako
- Kelompok: 4
- Repository: https://github.com/zdamnda-blip/Kelompok-4-Tugas-RPL

---

## Daftar Isi

1. [Tentang Proyek](#tentang-proyek)
2. [Implementasi CI Pipeline](#implementasi-ci-pipeline)
3. [Bukti Eksekusi Pipeline](#bukti-eksekusi-pipeline)
4. [Ringkasan Error dan Solusi Perbaikan](#ringkasan-error-dan-solusi-perbaikan)
5. [Pembagian Peran dan Tanggung Jawab Tim](#pembagian-peran-dan-tanggung-jawab-tim)

---

## Tentang Proyek

Informasi mengenai lokasi tempat sampah di lingkungan kampus sering tidak diketahui oleh mahasiswa maupun pengunjung. Peta Sampah UNTAD dibuat untuk menampilkan lokasi tersebut beserta kondisinya dalam satu peta yang mudah diakses. Aplikasi ini dikembangkan oleh Faiq Muhammad menggunakan HTML, CSS, dan JavaScript tanpa framework, dengan Leaflet sebagai pustaka peta dan localStorage sebagai tempat penyimpanan data.

Fitur utama aplikasi meliputi peta interaktif dengan penanda status tempat sampah, filter berdasarkan kategori (Organik, Anorganik, B3, dan Campur), pencarian tempat sampah terdekat dengan GPS, penambahan lokasi dan pelaporan kondisi oleh pengguna, serta halaman admin untuk menyetujui atau menolak pengajuan.

Pada tugas ini, repository dilengkapi dengan pipeline Continuous Integration (CI) menggunakan GitHub Actions agar setiap perubahan kode diperiksa dan di-build secara otomatis. Dokumen ini menjelaskan rancangan pipeline tersebut, hasil eksekusinya, serta satu kasus error yang terjadi selama pengerjaan.

---

## Implementasi CI Pipeline

CI adalah praktik memeriksa dan membangun kode secara otomatis setiap kali terjadi perubahan, sehingga kesalahan dapat diketahui sebelum perubahan digabungkan ke branch utama. Pipeline pada proyek ini didefinisikan dalam satu berkas, .github/workflows/ci.yml, dengan nama workflow CI - Test & Build Peta Sampah UNTAD.

Pipeline dipicu oleh tiga kondisi: push ke branch main, master, atau develop; pull request yang menuju branch tersebut; dan pemicuan manual melalui workflow_dispatch. Seluruh proses berjalan dalam satu job bernama lint-test-build pada ubuntu-latest dengan Node.js 20. Karena aplikasi berupa web statis, tidak ada dependensi yang dipasang terlebih dahulu. Alat bantu yang dibutuhkan (HTMLHint, Stylelint, clean-css, dan terser) diunduh otomatis melalui npx pada tahap yang memerlukannya.

Pipeline terdiri atas sembilan tahap yang dijalankan berurutan. Apabila satu tahap gagal, tahap berikutnya tidak dijalankan dan run dinyatakan gagal.

1. Checkout Repository. Mengambil kode terbaru dari repository.
2. Setup Node.js. Menyiapkan Node.js 20 sebagai lingkungan pemeriksaan dan build.
3. Locate Project Root. Menentukan lokasi index.html, baik di root repository maupun di folder Peta Sampah. Pipeline berhenti jika berkas tidak ditemukan.
4. Verify Required Files and Assets. Memastikan sembilan berkas wajib tersedia, yaitu index.html, admin.html, robots.txt, css/style.css, js/data.js, js/map.js, js/forms.js, js/admin.js, dan assets/logo-untad.png.
5. JavaScript Syntax Check. Memeriksa sintaks setiap berkas di folder js/ dengan node --check, sehingga kesalahan penulisan kode terdeteksi tanpa menjalankan aplikasi.
6. HTML and CSS Validation. Memvalidasi HTML dengan HTMLHint dan CSS dengan Stylelint. Hasil Stylelint hanya berupa peringatan dan tidak menggagalkan pipeline.
7. Functional and Integration Test. Menjalankan server lokal dan mengakses sembilan alamat (halaman utama, halaman admin, CSS, empat berkas JavaScript, dan logo) yang seluruhnya harus menjawab HTTP 200. Tahap ini juga memastikan index.html memuat teks "Peta Sampah UNTAD" dan admin.html memuat elemen adminPassword.
8. Build Production Bundle. Menyalin berkas statis ke folder dist/ serta memperkecil ukuran CSS dengan clean-css dan JavaScript dengan terser.
9. Upload Build Artifact. Mengunggah folder dist/ sebagai artifact peta-sampah-untad-build yang disimpan selama 7 hari.

---

## Bukti Eksekusi Pipeline

Pipeline dijalankan tiga kali dengan hasil sebagai berikut:

- Run awal berhasil: [Lihat run](https://github.com/zdamnda-blip/Kelompok-4-Tugas-RPL/actions/runs/43695786995/job/132755882444)
- Run gagal pada tahap JavaScript Syntax Check: [Lihat run](https://github.com/zdamnda-blip/Kelompok-4-Tugas-RPL/actions/runs/43696183492/job/132757105717)
- Run berhasil setelah perbaikan: [Lihat run](https://github.com/zdamnda-blip/Kelompok-4-Tugas-RPL/actions/runs/43697096263/job/132759979838)

---

## Ringkasan Error dan Solusi Perbaikan

Pada run yang gagal, tahap 1 sampai 4 berhasil, tetapi pipeline berhenti pada tahap 5 (JavaScript Syntax Check). Tahap 6 sampai 9 tidak dijalankan. Log pipeline mencatat error berikut:

```text
Checking syntax: ./js/admin.js
js/admin.js:165
SyntaxError: Unexpected end of input
Error: Process completed with exit code 1.
```

Pesan Unexpected end of input menunjukkan bahwa Node.js telah mencapai akhir berkas pada baris 165 sementara masih ada blok kode yang belum selesai. Penyebabnya adalah fungsi showDashboard() di js/admin.js tidak memiliki tanda kurung kurawal penutup }. Blok fungsi tersebut tidak pernah tertutup sehingga seluruh berkas dianggap tidak valid. Kesalahan seperti ini mudah terlewat saat kode dibaca, tetapi langsung terdeteksi oleh pipeline karena log menyebutkan nama berkas dan baris yang bermasalah.

Perbaikan dilakukan dengan menambahkan } penutup pada fungsi showDashboard(). Perubahan tersebut di-commit dan di-push sehingga pipeline berjalan kembali secara otomatis. Pada run setelah perbaikan, tahap JavaScript Syntax Check lulus dan seluruh tahap hingga pengunggahan artifact berhasil.

Kasus ini menunjukkan manfaat CI: kesalahan sintaks diketahui beberapa detik setelah push dan dapat diperbaiki dengan cepat tanpa perlu membuka aplikasi untuk mengujinya secara manual.

---

## Pembagian Peran dan Tanggung Jawab Tim

| Nama | NIM | Peran | Tanggung Jawab |
|---|---|---|---|
| Zaskia Dian Amanda | F5512510031 | DevOps | Membuat workflow ci.yml, menjalankan dan memperbaiki pipeline CI, serta menyusun dokumentasi |
| Faiq Muhammad | F5512510001 | Pengembang Web | Membuat aplikasi web Peta Sampah UNTAD |
| Cindy Novita Auliya | F5512510021 | Pengujian dan Dokumentasi | Memeriksa hasil run pipeline dan membantu menyusun laporan |
