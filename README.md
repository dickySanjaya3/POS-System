# NEXPOS - Sistem Kasir Ritel Modern

NEXPOS adalah sistem *Point of Sale* (POS) ritel modern berbasis web yang dirancang untuk kecepatan operasional di gardu kasir serta keamanan data manajemen di area belakang toko (*back-office*). Proyek ini dibangun menggunakan Next.js (App Router) dan Supabase.

## 🚀 Fitur Utama Sistem Kasir

* **Terminal Kasir Cepat (`/cashier`):** Dilengkapi sistem pengunci fokus kursor otomatis (`globalClick`), memastikan scanner barcode selalu aktif mendeteksi barang tanpa terganggu klik mouse yang tidak sengaja.
* **Akses Berlapis & Rute Aman:** Modul administrasi sensitif dilindungi sistem autentikasi terpusat yang otomatis mengalihkan pengguna ke halaman login jika mendeteksi akses tanpa wewenang.
* **Manajemen Inventori & SKU Gudang (`/admin`):** Ruang kerja khusus untuk memantau data barang, pembaruan harga jual, serta sistem deteksi dini otomatis untuk produk dengan status stok kritis ($\le 5$ Pcs).
* **Dasbor Eksekutif Supervisor (`/supervisor`):** Lembar pemantauan omset toko menggunakan grafik interaktif ringkas, metrik rata-rata belanja (*basket size*), serta modul internal untuk memperbarui kata sandi staf secara aman.

## 🛠️ Tech Stack Proyek

* **Frontend & Routing:** Next.js (App Router)
* **Desain Antarmuka:** Tailwind CSS & Lucide React Icons
* **Grafik Analitik:** Recharts Component Library
* **Backend & Autentikasi:** Supabase Client SDK

## 📂 Struktur Navigasi Halaman

```text
app/
├── admin/          # Workspace data barang & filter stok kritis
├── cashier/        # Halaman utama kasir dengan fitur scanner lock
├── supervisor/     # Dasbor analitik omset & manajemen staff
├── layout.tsx
└── page.tsx        # Hub Navigasi Utama (Halaman Awal 3 Card)
